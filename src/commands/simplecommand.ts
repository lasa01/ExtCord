import { Argument } from "./arguments/argument";
import { Command, ICommandInfo, IExecutionContext } from "./command";

export class SimpleCommand extends Command {
    public execute: (context: IExecutionContext) => Promise<void>;

    constructor(info: ICommandInfo, args: Argument[], execute: (context: IExecutionContext) => Promise<void>,
                allowEveryone = false) {
        super(info, args, allowEveryone);
        this.execute = execute;
    }
}
