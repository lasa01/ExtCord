import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

export class FloatArgument<T extends boolean> extends Argument<number, T, number> {
    public min: number;
    public max: number;

    constructor(info: IArgumentInfo, optional: T, min = -Infinity, max = Infinity) {
        super(info, optional, false);
        this.min = min;
        this.max = max;
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse) {
        const float = parseFloat(data);
        if (isNaN(float)) {
            return error(CommandPhrases.invalidNumberArgument);
        }
        if (this.min > float) {
            return error(CommandPhrases.tooSmallArgument, { min: this.min.toString() });
        }
        if (this.max < float) {
            return error(CommandPhrases.tooBigArgument, { max: this.max.toString() });
        }
        return float;
    }

    public parse(data: string, context: ICommandContext, passed: number): number {
        return passed;
    }
}
