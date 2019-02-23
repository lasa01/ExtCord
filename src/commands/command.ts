import { Message } from "discord.js";

import { Phrase } from "../language/phrase/phrase";
import { PhraseGroup } from "../language/phrase/phrasegroup";
import { SimplePhrase } from "../language/phrase/simplephrase";
import { Module } from "../modules/module";
import { Permission } from "../permissions/permission";
import { Argument } from "./arguments/argument";
import { Commands, ICommandContext } from "./commands";

export abstract class Command {
    public name: string;
    public localizedName: SimplePhrase;
    public description: string;
    public localizedDescription: SimplePhrase;
    public from?: Module;
    public author: string;
    public arguments: Argument[];
    private defaultPermission: Permission;
    private phraseGroup?: PhraseGroup;
    private argPhraseGroup?: PhraseGroup;
    private argPhrases: Phrase[];

    constructor(info: ICommandInfo, args: Argument[], allowEveryone = false, defaultPermission?: Permission) {
        this.name = info.name;
        this.localizedName = new SimplePhrase({
            description: `The name for the command ${this.name}`,
            name: "name",
        }, this.name);
        this.description = info.description;
        this.localizedDescription = new SimplePhrase({
            description: `The description for the command ${this.name}`,
            name: "description",
        }, this.name);
        this.argPhrases = [];
        if (Module.isPrototypeOf(info.author)) {
            this.from = info.author as Module;
            this.author = this.from.author;
        } else {
            this.author = info.author as string;
        }
        this.arguments = args;
        for (const argument of this.arguments) {
            argument.register(this);
        }
        this.defaultPermission = defaultPermission || new Permission({
            description: `Gives the permission for the command ${info.name}`,
            name: info.name,
        }, allowEveryone);
    }

    public register(commands: Commands) {
        this.argPhraseGroup = new PhraseGroup({
            description: `Command arguments`,
            name: "arguments",
        }, this.argPhrases);
        this.phraseGroup = new PhraseGroup({
            description: `Language definitions for the command ${this.name}`,
            name: this.name,
        }, [ this.localizedDescription, this.localizedName, this.argPhraseGroup ]);
        commands.registerPhrase(this.phraseGroup);
    }

    public registerPhrase(phrase: Phrase) {
        this.argPhrases.push(phrase);
    }

    public rename() {
        this.name = `${this.author}-${this.name}`;
        return this.name;
    }

    public getPermission() {
        return this.defaultPermission;
    }

    public async command(context: ICommandContext) {
        const rawArguments = context.passed.split(" ");
        // Negative if not enough arguments, 0 if correct amount, positive if too many
        const deltaArgs = rawArguments.length - this.arguments.length;
        if (deltaArgs < 0) { return; } // For now
        // Combine extra arguments if the last argument allows it
        if (deltaArgs > 0 && this.arguments[this.arguments.length - 1].allowCombining) {
            for (let i = deltaArgs; i > 0; i--) {
                rawArguments.push(rawArguments.pop() + " " + rawArguments.pop());
            }
        }
        const parsed: any[] = [];
        for (const argument of this.arguments) {
            const rawArgument = rawArguments.shift()!;
            if (!argument.check(rawArgument)) {
                continue; // For now
            }
            parsed.push(argument.parse(rawArgument));
        }
        if (await this.defaultPermission.checkFull(context.message.member)) {
            await this.execute({...context, arguments: parsed, rawArguments});
        }
    }

    public abstract async execute(context: IExecutionContext): Promise<void>;

}

export interface IExecutionContext {
    message: Message;
    prefix: string;
    command: string;
    rawArguments: string[];
    arguments: any[];
}

export interface ICommandInfo {
    name: string;
    description: string;
    author: string | Module;
}
