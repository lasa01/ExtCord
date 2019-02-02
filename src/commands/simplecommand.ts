import Module from "../modules/module";
import Command, { IExecutionContext } from "./command";

export default class SimpleCommand extends Command {
    constructor(name: string, author: Module | string, execute: (context: IExecutionContext) => Promise<void>,
                allowEveryone = false) {
        super(name, author, allowEveryone);
        this.execute = execute;
    }
}
