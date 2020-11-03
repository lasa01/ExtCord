import { User } from "discord.js";

import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

const MENTION_REGEX = /^<@!?(\d+)>$/;

/**
 * A command argument resolving to a user the bot is aware of.
 * @typeparam T A boolean representing whether the argument is optional.
 * @category Command Argument
 */
export class UserArgument<T extends boolean> extends Argument<User, T, string> {
    /**
     * Creates a new user argument.
     * @param info Defines basic argument parameters.
     * @param optional Allows the argument to be omitted.
     */
    constructor(info: IArgumentInfo, optional: T) {
        super(info, optional, false);
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse): Promise<string|undefined> {
        const match = MENTION_REGEX.exec(data);
        if (!match) {
            return error(CommandPhrases.invalidUserArgument);
        }
        const id = match[1];
        if (!context.bot.client!.users.fetch(id)) {
            return error(CommandPhrases.invalidUserMentionArgument);
        }
        return id;
    }

    public parse(data: string, context: ICommandContext, passed: string): User {
        return context.bot.client!.users.cache.get(passed)!;
    }
}
