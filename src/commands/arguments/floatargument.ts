import { CommandPhrases } from "../commandphrases";
import { ICommandContext } from "../commands";
import { Argument, IArgumentInfo } from "./argument";

export class FloatArgument extends Argument<number> {
    public min: number;
    public max: number;

    constructor(info: IArgumentInfo, optional = false, min = -Infinity, max = Infinity) {
        super(info, optional, false);
        this.min = min;
        this.max = max;
    }

    public async check(data: string, context: ICommandContext) {
        const float = parseFloat(data);
        if (isNaN(float)) {
            await context.respond(CommandPhrases.invalidArgument, {
                argument: data,
                reason: CommandPhrases.invalidNumberArgument.get(context.language),
            });
            return false;
        }
        if (this.min > float) {
            await context.respond(CommandPhrases.invalidArgument, {
                argument: data,
                reason: CommandPhrases.tooSmallArgument.format(context.language, { min: this.min.toString() }),
            });
            return false;
        }
        if (this.max < float) {
            await context.respond(CommandPhrases.invalidArgument, {
                argument: data,
                reason: CommandPhrases.tooBigArgument.format(context.language, { max: this.max.toString() }),
            });
            return false;
        }
        return true;
    }

    public parse(data: string, context: ICommandContext): number {
        return parseFloat(data);
    }
}
