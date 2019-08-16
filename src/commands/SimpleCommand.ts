import { Argument } from "./arguments/Argument";
import { Command, ICommandInfo, IExecutionContext } from "./Command";

export class SimpleCommand<T extends ReadonlyArray<Argument<any, boolean>>> extends Command<T> {
    public execute: (context: IExecutionContext<T>) => Promise<void>;

    constructor(info: ICommandInfo, args: T, execute: (context: IExecutionContext<T>) => Promise<void>,
                allowEveryone = false) {
        super(info, args, allowEveryone);
        this.execute = execute;
    }
}
