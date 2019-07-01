import { CommandPhrases } from "../commandphrases";
import { ICommandContext } from "../commands";
import { Argument, IArgumentInfo } from "./argument";

export class IntArgument extends Argument<number> {
    public min: number;
    public max: number;

    constructor(info: IArgumentInfo, optional = false, min = -Infinity, max = Infinity) {
        super(info, optional, false);
        this.min = min;
        this.max = max;
    }

    public async check(data: string, context: ICommandContext) {
        const int = parseInt(data, 10);
        if (isNaN(int)) {
            await context.respond(CommandPhrases.invalidIntegerArgument, { argument: data });
            return false;
        }
        if (this.min > int) {
            await context.respond(CommandPhrases.tooSmallArgument, { argument: data, min: this.min.toString() });
            return false;
        }
        if (this.max < int) {
            await context.respond(CommandPhrases.tooBigArgument, { argument: data, max: this.max.toString() });
            return false;
        }
        return true;
    }

    public parse(data: string): number {
        return parseInt(data, 10);
    }
}
