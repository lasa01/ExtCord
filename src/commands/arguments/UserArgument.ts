import { User } from "discord.js";

import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

const MENTION_REGEX = /^<@!?(\d+)>$/;

export class UserArgument<T extends boolean> extends Argument<User, T> {
    constructor(info: IArgumentInfo, optional: T) {
        super(info, optional, false);
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse): Promise<boolean> {
        const match = MENTION_REGEX.exec(data);
        if (!match) {
            return error(CommandPhrases.invalidUserArgument);
        }
        const id = match[1];
        if (!context.bot.client!.users.has(id)) {
            return error(CommandPhrases.invalidUserMentionArgument);
        }
        return false;
    }

    public parse(data: string, context: ICommandContext): User {
        return context.bot.client!.users.get(MENTION_REGEX.exec(data)![1])!;
    }
}
