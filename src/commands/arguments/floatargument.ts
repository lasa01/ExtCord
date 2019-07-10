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

    public async check(data: string, context: ICommandContext) {
        const float = parseFloat(data);
        if (isNaN(float)) {
            return CommandPhrases.invalidNumberArgument;
        }
        if (this.min > float) {
            return CommandPhrases.tooSmallArgument;
        }
        if (this.max < float) {
            return CommandPhrases.tooBigArgument;
        }
    }

    public parse(data: string, context: ICommandContext): number {
        return parseFloat(data);
    }
}
