import { CommandInteractionOption } from "discord.js";
import { Permission } from "../../permissions/Permission";
import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

/**
 * A permission argument.
 * @typeparam T A boolean representing whether the argument is optional.
 * @category Permission Argument
 */
export class PermissionArgument<T extends boolean> extends Argument<Permission, T, Permission> {
    /**
     * Creates a new permission argument.
     * @param info Defines basic argument parameters.
     * @param optional Allows the argument to be omitted.
     */
    constructor(info: IArgumentInfo, optional: T) {
        super(info, optional);
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse):
        Promise<Permission | undefined> {
        const p = context.bot.permissions.get(data);
        if (!p) {
            return error(CommandPhrases.invalidPermissionArgument);
        }
        return p;
    }

    public parse(data: string, context: ICommandContext, passed: Permission): Permission {
        return passed;
    }

    public async checkOption(
        data: CommandInteractionOption,
        context: ICommandContext,
        error: ILinkedErrorResponse,
    ): Promise<Permission | undefined> {
        if (typeof data.value !== "string") {
            return error(CommandPhrases.invalidPermissionArgument);
        }

        const p = context.bot.permissions.get(data.value);
        if (!p) {
            return error(CommandPhrases.invalidPermissionArgument);
        }
        return p;

    }

    public parseOption(data: CommandInteractionOption, context: ICommandContext, passed: Permission): Permission {
        return passed;
    }
}
