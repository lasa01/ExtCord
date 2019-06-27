import { Argument } from "./arguments/argument";
import { Command, ICommandInfo, IExecutionContext } from "./command";

export class SimpleCommand<T extends ReadonlyArray<Argument<any>>> extends Command<T> {
    public execute: (context: IExecutionContext<T>) => Promise<void>;

    constructor(info: ICommandInfo, args: T, execute: (context: IExecutionContext<T>) => Promise<void>,
                allowEveryone = false) {
        super(info, args, allowEveryone);
        this.execute = execute;
    }
}
