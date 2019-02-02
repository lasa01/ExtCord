import Discord from "discord.js";

import Module from "../modules/module";
import Permission from "../permissions/permission";

export default class Command {
    public name: string;
    public from?: Module;
    public author: string;
    private defaultPermission: Permission;

    constructor(name: string, author: Module | string, allowEveryone = false, defaultPermission?: Permission) {
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
        }, allowEveryone);
    }

    public rename() {
        this.name = `${this.author}-${this.name}`;
        return this.name;
    }

    public getPermission() {
        return this.defaultPermission;
    }

    public async command(context: IExecutionContext) {
        if (await this.defaultPermission.checkFull(context.message.member)) {
            await this.execute(context);
        }
    }

    protected async execute(context: IExecutionContext) { return; }
}

export interface IExecutionContext {
    message: Discord.Message;
    prefix: string;
    command: string;
    arguments: string;
}
