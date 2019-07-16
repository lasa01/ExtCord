import { LinkedErrorResponse } from "../command";
import { CommandPhrases } from "../commandphrases";
import { ICommandContext } from "../commands";
import { Argument, IArgumentInfo } from "./argument";

export class IntArgument<T extends boolean> extends Argument<number, T> {
    public min: number;
    public max: number;

    constructor(info: IArgumentInfo, optional: T, min = -Infinity, max = Infinity) {
        super(info, optional, false);
        this.min = min;
        this.max = max;
    }

    public async check(data: string, context: ICommandContext, error: LinkedErrorResponse) {
        const int = parseInt(data, 10);
        if (isNaN(int)) {
            return error(CommandPhrases.invalidIntegerArgument, {});
        }
        if (this.min > int) {
            return error(CommandPhrases.tooSmallArgument, { min: this.min.toString() });
        }
        if (this.max < int) {
            return error(CommandPhrases.tooBigArgument, { max: this.max.toString() });
        }
        return true;
    }

    public parse(data: string): number {
        return parseInt(data, 10);
    }
}
