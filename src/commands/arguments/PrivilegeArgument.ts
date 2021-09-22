import { CommandInteractionOption } from "discord.js";
import { PermissionPrivilege } from "../../permissions/PermissionPrivilege";
import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

/**
 * A privilege argument.
 * @typeparam T A boolean representing whether the argument is optional.
 * @category Permission Argument
 */
export class PrivilegeArgument<T extends boolean> extends Argument<PermissionPrivilege, T, PermissionPrivilege> {
    /**
     * Creates a new privilege argument.
     * @param info Defines basic argument parameters.
     * @param optional Allows the argument to be omitted.
     */
    constructor(info: IArgumentInfo, optional: T) {
        super(info, optional);
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse):
        Promise<PermissionPrivilege | undefined> {
        const p = await context.bot.permissions.getPrivilege(context.guild.entity, data);
        if (!p) {
            return error(CommandPhrases.invalidPrivilegeArgument);
        }
        return p;
    }

    public parse(data: string, context: ICommandContext, passed: PermissionPrivilege): PermissionPrivilege {
        return passed;
    }

    public async checkOption(
        data: CommandInteractionOption,
        context: ICommandContext,
        error: ILinkedErrorResponse,
    ): Promise<PermissionPrivilege | undefined> {
        if (typeof data.value !== "string") {
            return error(CommandPhrases.invalidPermissionArgument);
        }

        const p = await context.bot.permissions.getPrivilege(context.guild.entity, data.value);
        if (!p) {
            return error(CommandPhrases.invalidPrivilegeArgument);
        }
        return p;
    }

    public parseOption(
        data: CommandInteractionOption,
        context: ICommandContext,
        passed: PermissionPrivilege,
    ): PermissionPrivilege {
        return passed;
    }
}
