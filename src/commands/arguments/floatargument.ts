import { ILinkedErrorResponse } from "../command";
import { CommandPhrases } from "../commandphrases";
import { ICommandContext } from "../commands";
import { Argument, IArgumentInfo } from "./argument";

export class FloatArgument<T extends boolean> extends Argument<number, T> {
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
        return false;
    }

    public parse(data: string, context: ICommandContext): number {
        return parseFloat(data);
    }
}
