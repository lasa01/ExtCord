import { ExtendedMember } from "../../util/Types";
import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

const MENTION_REGEX = /^<@!?(\d+)>$/;

export class MemberArgument<T extends boolean> extends Argument<Promise<ExtendedMember>, T> {
    constructor(info: IArgumentInfo, optional: T) {
        super(info, optional, false);
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse): Promise<boolean> {
        const match = MENTION_REGEX.exec(data);
        if (!match) {
            return error(CommandPhrases.invalidMemberArgument);
        }
        const id = match[1];
        if (!context.message.guild.members.has(id)) {
            return error(CommandPhrases.invalidMemberMentionArgument);
        }
        return false;
    }

    public async parse(data: string, context: ICommandContext): Promise<ExtendedMember> {
        const member = context.message.guild.members.get(MENTION_REGEX.exec(data)![1])!;
        return Object.assign(member, {
            entity: await context.bot.database.repos.member!.getEntity(member),
            guild: Object.assign(member.guild, {
                entity: await context.bot.database.repos.guild!.getEntity(member.guild),
            }),
            user: Object.assign(member.user, {
                entity: await context.bot.database.repos.user!.getEntity(member.user),
            }),
        });
    }
}
