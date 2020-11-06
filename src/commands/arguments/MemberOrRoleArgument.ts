import { Database } from "../../database/Database";
import { MemberRepository } from "../../database/repo/MemberRepository";
import { RoleRepository } from "../../database/repo/RoleRepository";
import { IExtendedMember, IExtendedRole } from "../../util/Types";
import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

const MEMBER_MENTION_REGEX = /^<@!?(\d+)>$/;
const ROLE_MENTION_REGEX = /^<@&(\d+)>$/;

/**
 * A command argument resolving to a member of the relevant guild.
 * @typeparam T A boolean representing whether the argument is optional.
 * @category Command Argument
 */
export class MemberOrRoleArgument<T extends boolean>
        extends Argument<Promise<IExtendedMember | IExtendedRole>, T, [boolean, string]> {
    public memberRepo?: MemberRepository;
    public roleRepo?: RoleRepository;

    /**
     * Creates a new member argument.
     * @param info Defines basic argument parameters.
     * @param optional Allows the argument to be omitted.
     * @param database The database for returned extended members.
     */
    constructor(info: IArgumentInfo, optional: T) {
        super(info, optional, false);
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse):
            Promise<[boolean, string]|undefined> {
        if (data === "@everyone") {
            return [true, context.message.guild.guild.id];
        }
        let match = MEMBER_MENTION_REGEX.exec(data);
        if (!match) {
            match = ROLE_MENTION_REGEX.exec(data);
            if (!match) {
                return error(CommandPhrases.invalidMemberOrRoleArgument);
            }
            const id = match[1];
            if (!await context.message.guild.guild.roles.fetch(id)) {
                return error(CommandPhrases.invalidRoleMentionArgument);
            }
            return [true, id];
        } else {
            const id = match[1];
            if (!await context.message.guild.guild.members.fetch(id)) {
                return error(CommandPhrases.invalidMemberMentionArgument);
            }
            return [false, id];
        }
    }

    public async parse(data: string, context: ICommandContext, passed: [boolean, string]):
            Promise<IExtendedMember | IExtendedRole> {
        this.ensureRepo(context.bot.database);
        const [isRole, id] = passed;
        if (isRole) {
            const role = context.message.guild.guild.roles.cache.get(id)!;
            return {
                entity: await this.roleRepo.getEntity(role),
                role,
            };
        } else {
            const member = context.message.guild.guild.members.cache.get(id)!;
            return {
                entity: await this.memberRepo.getEntity(member),
                member,
            };
        }
    }

    private ensureRepo(database: Database): asserts this is this & {
        memberRepo: MemberRepository,
        roleRepo: RoleRepository,
    } {
        if (!this.memberRepo || !this.roleRepo) {
            database.ensureConnection();
            this.memberRepo = database.repos.member;
            this.roleRepo = database.repos.role;
        }
    }
}
