import { User } from "discord.js";

import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

const MENTION_REGEX = /^<@!?(\d+)>$/;

export class UserArgument<T extends boolean> extends Argument<User, T, string> {
    constructor(info: IArgumentInfo, optional: T) {
        super(info, optional, false);
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse): Promise<string|undefined> {
        const match = MENTION_REGEX.exec(data);
        if (!match) {
            return error(CommandPhrases.invalidUserArgument);
        }
        const id = match[1];
        if (!context.bot.client!.users.has(id)) {
            return error(CommandPhrases.invalidUserMentionArgument);
        }
        return id;
    }

    public parse(data: string, context: ICommandContext, passed: string): User {
        return context.bot.client!.users.get(passed)!;
    }
}
