import { Argument, IArgumentInfo } from "./argument";

export class IntArgument extends Argument<number> {
    public min: number;
    public max: number;

    constructor(info: IArgumentInfo, optional = false, min = -Infinity, max = Infinity) {
        super(info, optional, false);
        this.min = min;
        this.max = max;
    }

    public check(data: string) {
        const int = parseInt(data, 10);
        return !isNaN(int) && this.min <= int && this.max >= int;
    }

    public parse(data: string): number {
        return parseInt(data, 10);
    }
}
