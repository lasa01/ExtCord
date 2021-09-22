import { CommandInteractionOption, TextChannel } from "discord.js";

import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

const MENTION_REGEX = /^<#(\d+)>$/;

/**
 * A command argument resolving to a text channel of the relevant guild.
 * @typeparam T A boolean representing whether the argument is optional.
 * @category Command Argument
 */
export class TextChannelArgument<T extends boolean> extends Argument<TextChannel, T, TextChannel> {
    /**
     * Creates a new text channel argument.
     * @param info Defines basic argument parameters.
     * @param optional Allows the argument to be omitted.
     */
    constructor(info: IArgumentInfo, optional: T) {
        super(info, optional, false);
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse):
        Promise<TextChannel | undefined> {
        const match = MENTION_REGEX.exec(data);
        if (!match) {
            return error(CommandPhrases.invalidChannelArgument);
        }
        const channel = context.guild.guild.channels.cache.get(match[1]);
        if (!channel) {
            return error(CommandPhrases.invalidChannelMentionArgument);
        }
        if (!(channel instanceof TextChannel)) {
            return error(CommandPhrases.invalidTextChannelArgument);
        }
        return channel;
    }

    public parse(data: string, context: ICommandContext, passed: TextChannel): TextChannel {
        return passed;
    }

    public async checkOption(
        data: CommandInteractionOption,
        context: ICommandContext,
        error: ILinkedErrorResponse,
    ): Promise<TextChannel | undefined> {
        if (!(data.channel instanceof TextChannel)) {
            return error(CommandPhrases.invalidTextChannelArgument);
        }
        return data.channel;
    }

    public parseOption(data: CommandInteractionOption, context: ICommandContext, passed: TextChannel): TextChannel {
        return passed;
    }
}
