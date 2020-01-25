import { Role } from "discord.js";

import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

const MENTION_REGEX = /^<@&(\d+)>$/;

/**
 * A command argument resolving to a role of the relevant guild.
 * @typeparam T A boolean representing whether the argument is optional.
 * @category Command Argument
 */
export class RoleArgument<T extends boolean> extends Argument<Role, T, string> {
    /**
     * Creates a new role argument.
     * @param info Defines basic argument parameters.
     * @param optional Allows the argument to be omitted.
     */
    constructor(info: IArgumentInfo, optional: T) {
        super(info, optional, false);
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse): Promise<string|undefined> {
        if (data === "@everyone") {
            return context.message.guild.guild.id;
        }
        const match = MENTION_REGEX.exec(data);
        if (!match) {
            return error(CommandPhrases.invalidRoleArgument);
        }
        const id = match[1];
        if (!context.message.guild.guild.roles.has(id)) {
            return error(CommandPhrases.invalidRoleMentionArgument);
        }
        return id;
    }

    public parse(data: string, context: ICommandContext, passed: string): Role {
        return context.message.guild.guild.roles.get(passed)!;
    }
}
