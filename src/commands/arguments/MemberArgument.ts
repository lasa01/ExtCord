import { Database } from "../../database/Database";
import { MemberRepository } from "../../database/repo/MemberRepository";
import { IExtendedMember } from "../../util/Types";
import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

const MENTION_REGEX = /^<@!?(\d+)>$/;

/**
 * A command argument resolving to a member of the relevant guild.
 * @typeparam T A boolean representing whether the argument is optional.
 * @category Command Argument
 */
export class MemberArgument<T extends boolean> extends Argument<Promise<IExtendedMember>, T, string> {
    /** The database for fetching members. */
    public repo?: MemberRepository;
    private database: Database;

    /**
     * Creates a new member argument.
     * @param info Defines basic argument parameters.
     * @param optional Allows the argument to be omitted.
     * @param database The database for returned extended members.
     */
    constructor(info: IArgumentInfo, optional: T, database: Database) {
        super(info, optional, false);
        this.database = database;
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse): Promise<string|undefined> {
        const match = MENTION_REGEX.exec(data);
        if (!match) {
            return error(CommandPhrases.invalidMemberArgument);
        }
        const id = match[1];
        if (!await context.message.guild.guild.members.fetch(id)) {
            return error(CommandPhrases.invalidMemberMentionArgument);
        }
        return id;
    }

    public async parse(data: string, context: ICommandContext, passed: string): Promise<IExtendedMember> {
        this.ensureRepo();
        const member = context.message.guild.guild.members.cache.get(passed)!;
        return {
            entity: await this.repo.getEntity(member),
            member,
        };
    }

    private ensureRepo(): asserts this is this & { repo: MemberRepository } {
        if (!this.repo) {
            this.database.ensureConnection();
            this.repo = this.database.repos.member;
        }
    }
}
