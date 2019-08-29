import { Role } from "discord.js";

import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

const MENTION_REGEX = /^<@&(\d+)>$/;

export class RoleArgument<T extends boolean> extends Argument<Role, T> {
    constructor(info: IArgumentInfo, optional: T) {
        super(info, optional, false);
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse): Promise<boolean> {
        if (data === "@everyone") {
            return false;
        }
        const match = MENTION_REGEX.exec(data);
        if (!match) {
            return error(CommandPhrases.invalidRoleArgument);
        }
        const id = match[1];
        if (!context.message.guild.roles.has(id)) {
            return error(CommandPhrases.invalidRoleMentionArgument);
        }
        return false;
    }

    public parse(data: string, context: ICommandContext): Role {
        if (data === "@everyone") {
            return context.message.guild.defaultRole;
        }
        return context.message.guild.roles.get(MENTION_REGEX.exec(data)![1])!;
    }
}
