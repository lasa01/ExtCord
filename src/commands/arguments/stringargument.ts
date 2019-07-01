import { ICommandContext } from "../commands";
import { Argument, IArgumentInfo } from "./argument";

export class StringArgument extends Argument<string> {
    private customCheck: (data: string, context: ICommandContext) => Promise<boolean>;

    constructor(info: IArgumentInfo, optional = false, allowSpaces = false,
                check?: (data: string, context: ICommandContext) => Promise<boolean>) {
        super(info, optional, allowSpaces);
        this.customCheck = check || (async () => true);
    }

    public async check(data: string, context: ICommandContext) {
        return this.customCheck(data, context);
    }

    public parse(data: string): string {
        return data;
    }
}
