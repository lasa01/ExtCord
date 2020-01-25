import { ILinkedErrorResponse } from "../Command";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

/**
 * A command argument that passes the raw argument as-is.
 * @typeparam T A boolean representing whether the argument is optional.
 * @category Command Argument
 */
export class StringArgument<T extends boolean> extends Argument<string, T, true> {
    private customCheck: (data: string, context: ICommandContext, error: ILinkedErrorResponse)
        => Promise<true|undefined>;

    /**
     * Creates a new string argument.
     * @param info Defines basic argument parameters.
     * @param optional Allows the argument to be omitted.
     * @param allowSpaces Allows the argument to contain spaces.
     * @param check A custom function for checking the argument validity.
     */
    constructor(info: IArgumentInfo, optional: T, allowSpaces = false,
                check?: (data: string, context: ICommandContext, error: ILinkedErrorResponse)
                    => Promise<true|undefined>) {
        super(info, optional, allowSpaces);
        this.customCheck = check ?? (async () => true);
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse): Promise<true|undefined> {
        return await this.customCheck(data, context, error) || undefined;
    }

    public parse(data: string): string {
        return data;
    }
}
