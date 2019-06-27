import { Argument, IArgumentInfo } from "./argument";

export class FloatArgument extends Argument<number> {
    public min: number;
    public max: number;

    constructor(info: IArgumentInfo, optional = false, min = -Infinity, max = Infinity) {
        super(info, optional, false);
        this.min = min;
        this.max = max;
    }

    public check(data: string) {
        const float = parseFloat(data);
        return !isNaN(float) && this.min <= float && this.max >= float;
    }

    public parse(data: string): number {
        return parseFloat(data);
    }
}
