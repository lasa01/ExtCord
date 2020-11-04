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
     * Creates a new command argument.
     * @param info Defines basic argument parameters.
     * @param optional Allows the argument to be omitted.
     */
    constructor(info: IArgumentInfo, optional: T) {
        super(info, optional);
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse):
        Promise<Permission|undefined> {
        const p = context.bot.permissions.get(data);
        if (!p) {
            return error(CommandPhrases.invalidPermissionArgument);
        }
        return p;
    }
    public parse(data: string, context: ICommandContext, passed: Permission): Permission {
        return passed;
    }
}
