import Discord from "discord.js";

import Module from "../modules/module";
import Permission from "../permissions/permission";

export default class Command {
    public name: string;
    public from?: Module;
    public author: string;
    private defaultPermission: Permission;

    constructor(name: string, author: Module | string, defaultPermission?: Permission) {
        this.name = name;
        if (Module.isPrototypeOf(author)) {
            this.from = author as Module;
            this.author = this.from.author;
        } else {
            this.author = author as string;
        }
        this.defaultPermission = defaultPermission || new Permission({
            description: `Gives the permission for the command ${name}`,
            name,
        }, false);
    }

    public rename() {
        this.name = `${this.author}-${this.name}`;
        return this.name;
    }

    public getPermission() {
        return this.defaultPermission;
    }

    public async execute(message: Discord.Message) {
        await this.onExecute({
            message,
        });
    }

    protected async onExecute(context: IExecutionContext) { return; }
}

export interface IExecutionContext {
    message: Discord.Message;
}
