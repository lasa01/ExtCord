import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

/**
 * A command argument resolving to an integer.
 * @typeparam T A boolean representing whether the argument is optional.
 * @category Command Argument
 */
export class IntArgument<T extends boolean> extends Argument<number, T, number> {
    /** Minimum value the argument accepts. */
    public min: number;
    /** Maximum value the argument accepts. */
    public max: number;

    /**
     * Creates a new int argument.
     * @param info Defines basic argument parameters.
     * @param optional Allows the argument to be omitted.
     * @param min Minimum value accepted for the numeral.
     * @param max Maximum value accepted for the numeral.
     */
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
