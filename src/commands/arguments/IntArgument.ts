import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

export class IntArgument<T extends boolean> extends Argument<number, T, number> {
    public min: number;
    public max: number;

    constructor(info: IArgumentInfo, optional: T, min = -Infinity, max = Infinity) {
        super(info, optional, false);
        this.min = min;
        this.max = max;
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse): Promise<number|undefined> {
        const int = parseInt(data, 10);
        if (isNaN(int)) {
            return error(CommandPhrases.invalidIntegerArgument);
        }
        if (this.min > int) {
            return error(CommandPhrases.tooSmallArgument, { min: this.min.toString() });
        }
        if (this.max < int) {
            return error(CommandPhrases.tooBigArgument, { max: this.max.toString() });
        }
        return int;
    }

    public parse(data: string, context: ICommandContext, passed: number): number {
        return passed;
    }
}
