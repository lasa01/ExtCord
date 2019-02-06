import Discord from "discord.js";

import Module from "../modules/module";
import Permission from "../permissions/permission";
import Argument from "./arguments/argument";

export default class Command {
    public name: string;
    public from?: Module;
    public author: string;
    public arguments: Argument[];
    private defaultPermission: Permission;

    constructor(info: ICommandInfo, args: Argument[], allowEveryone = false, defaultPermission?: Permission) {
        this.name = info.name;
        if (Module.isPrototypeOf(info.author)) {
            this.from = info.author as Module;
            this.author = this.from.author;
        } else {
            this.author = info.author as string;
        }
        this.arguments = args;
        this.defaultPermission = defaultPermission || new Permission({
            description: `Gives the permission for the command ${info.name}`,
            name: info.name,
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
    rawArguments: string[];
    arguments: any[];
}

export interface ICommandInfo {
    name: string;
    author: string | Module;
}
