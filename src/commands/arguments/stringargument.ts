import { ILinkedErrorResponse } from "../command";
import { ICommandContext } from "../commands";
import { Argument, IArgumentInfo } from "./argument";

export class StringArgument<T extends boolean> extends Argument<string, T> {
    private customCheck: (data: string, context: ICommandContext, error: ILinkedErrorResponse) => Promise<boolean>;

    constructor(info: IArgumentInfo, optional: T, allowSpaces = false,
                check?: (data: string, context: ICommandContext, error: ILinkedErrorResponse) => Promise<boolean>) {
        super(info, optional, allowSpaces);
        this.customCheck = check || (async () => false);
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse) {
        return this.customCheck(data, context, error);
    }

    public parse(data: string): string {
        return data;
    }
}
