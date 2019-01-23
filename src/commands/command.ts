import Discord from "discord.js";

import Module from "../modules/module";

export default class Command {
    public name: string;
    public from?: Module;
    public author: string;
    private onExecute: (arg0: IExecutionContext) => void;

    constructor(name: string, author: Module | string, onExecute: (arg0: IExecutionContext) => void) {
        this.name = name;
        if (Module.isPrototypeOf(author)) {
            this.from = author as Module;
            this.author = this.from.author;
        } else {
            this.author = author as string;
        }
        this.onExecute = onExecute;
    }

    public rename() {
        this.name = `${this.author}-${this.name}`;
        return this.name;
    }

    public execute(message: Discord.Message) {
        this.onExecute({ message });
    }
}

export interface IExecutionContext {
    message: Discord.Message;
}
