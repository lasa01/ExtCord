import { Argument, IArgumentInfo } from "./argument";

export class StringArgument extends Argument<string> {
    private customCheck: (data: string) => boolean;

    constructor(info: IArgumentInfo, optional = false, allowSpaces = false, check?: (data: string) => boolean) {
        super(info, optional, allowSpaces);
        this.customCheck = check || (() => true);
    }

    public check(data: string) {
        return (data !== "") && this.customCheck(data);
    }

    public parse(data: string): string {
        return data;
    }
}
