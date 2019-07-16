import { LinkedErrorResponse } from "../command";
import { ICommandContext } from "../commands";
import { Argument, IArgumentInfo } from "./argument";

export class StringArgument<T extends boolean> extends Argument<string, T> {
    private customCheck: (data: string, context: ICommandContext, error: LinkedErrorResponse) => Promise<boolean>;

    constructor(info: IArgumentInfo, optional: T, allowSpaces = false,
                check?: (data: string, context: ICommandContext, error: LinkedErrorResponse) => Promise<boolean>) {
        super(info, optional, allowSpaces);
        this.customCheck = check || (async () => false);
    }

    public async check(data: string, context: ICommandContext, error: LinkedErrorResponse) {
        return this.customCheck(data, context, error);
    }

    public parse(data: string): string {
        return data;
    }
}
