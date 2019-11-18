import { TextChannel } from "discord.js";

import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

const MENTION_REGEX = /^<#(\d+)>$/;

export class TextChannelArgument<T extends boolean> extends Argument<TextChannel, T> {
    constructor(info: IArgumentInfo, optional: T) {
        super(info, optional, false);
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse): Promise<boolean> {
        const match = MENTION_REGEX.exec(data);
        if (!match) {
            return error(CommandPhrases.invalidChannelArgument);
        }
        const channel = context.message.guild.guild.channels.get(match[1]);
        if (!channel) {
            return error(CommandPhrases.invalidChannelMentionArgument);
        }
        if (!(channel instanceof TextChannel)) {
            return error(CommandPhrases.invalidTextChannelArgument);
        }
        return false;
    }

    public parse(data: string, context: ICommandContext): TextChannel {
        return context.message.guild.guild.channels.get(MENTION_REGEX.exec(data)![1])! as TextChannel;
    }
}
