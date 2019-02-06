import Argument from "./arguments/argument";
import Command, { ICommandInfo, IExecutionContext } from "./command";

export default class SimpleCommand extends Command {
    constructor(info: ICommandInfo, args: Argument[], execute: (context: IExecutionContext) => Promise<void>,
                allowEveryone = false) {
        super(info, args, allowEveryone);
        this.execute = execute;
    }
}
