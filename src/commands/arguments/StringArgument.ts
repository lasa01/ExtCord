import { ILinkedErrorResponse } from "../Command";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

export class StringArgument<T extends boolean> extends Argument<string, T, true> {
    private customCheck: (data: string, context: ICommandContext, error: ILinkedErrorResponse)
        => Promise<true|undefined>;

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
