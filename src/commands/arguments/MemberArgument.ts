import { Database } from "../../database/Database";
import { MemberRepository } from "../../database/repo/MemberRepository";
import { IExtendedMember } from "../../util/Types";
import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

const MENTION_REGEX = /^<@!?(\d+)>$/;

export class MemberArgument<T extends boolean> extends Argument<Promise<IExtendedMember>, T> {
    public repo?: MemberRepository;
    private database: Database;

    constructor(info: IArgumentInfo, optional: T, database: Database) {
        super(info, optional, false);
        this.database = database;
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse): Promise<boolean> {
        const match = MENTION_REGEX.exec(data);
        if (!match) {
            return error(CommandPhrases.invalidMemberArgument);
        }
        const id = match[1];
        if (!context.message.guild.guild.members.has(id)) {
            return error(CommandPhrases.invalidMemberMentionArgument);
        }
        return false;
    }

    public async parse(data: string, context: ICommandContext): Promise<IExtendedMember> {
        this.ensureRepo();
        const member = context.message.guild.guild.members.get(MENTION_REGEX.exec(data)![1])!;
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
