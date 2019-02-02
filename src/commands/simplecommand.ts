import Module from "../modules/module";
import Command, { IExecutionContext } from "./command";

export default class SimpleCommand extends Command {
    constructor(name: string, author: Module | string, execute: (context: IExecutionContext) => Promise<void>) {
        super(name, author);
        this.onExecute = execute;
    }
}
