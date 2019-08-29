import { GuildMember } from "discord.js";

import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

const MENTION_REGEX = /^<@!?(\d+)>$/;

export class MemberArgument<T extends boolean> extends Argument<GuildMember, T> {
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

    public parse(data: string, context: ICommandContext): GuildMember {
        return context.message.guild.members.get(MENTION_REGEX.exec(data)![1])!;
    }
}
