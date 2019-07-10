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

    public async check(data: string, context: ICommandContext) {
        const int = parseInt(data, 10);
        if (isNaN(int)) {
            return CommandPhrases.invalidIntegerArgument;
        }
        if (this.min > int) {
            return CommandPhrases.tooSmallArgument;
        }
        if (this.max < int) {
            return CommandPhrases.tooBigArgument;
        }
    }

    public parse(data: string): number {
        return parseInt(data, 10);
    }
}
