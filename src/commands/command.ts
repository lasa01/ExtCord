import { Message } from "discord.js";
import { Logger } from "winston";

import { Phrase } from "../language/phrase/phrase";
import { PhraseGroup } from "../language/phrase/phrasegroup";
import { SimplePhrase } from "../language/phrase/simplephrase";
import { Module } from "../modules/module";
import { Permission } from "../permissions/permission";
import { Argument } from "./arguments/argument";
import { Commands, ICommandContext } from "./commands";

interface IArgumentTree extends Array<IArgumentTree|Argument> {
    [key: number]: IArgumentTree|Argument;
}

export abstract class Command {
    public name: string;
    public localizedName: SimplePhrase;
    public description: string;
    public localizedDescription: SimplePhrase;
    public from?: Module;
    public author: string;
    public arguments: Argument[];
    private minArguments: number;
    private defaultPermission: Permission;
    private phraseGroup?: PhraseGroup;
    private argPhraseGroup?: PhraseGroup;
    private argPhrases: Phrase[];
    private subPhraseGroup?: PhraseGroup;
    private subPhrases: Phrase[];
    private alwaysArgs: Argument[];
    private argCombinations: Argument[][];
    private argCheckTree: IArgumentTree;
    private logger?: Logger;

    constructor(info: ICommandInfo, args: Argument[], allowEveryone = false, defaultPermission?: Permission) {
        this.name = info.name;
        this.localizedName = new SimplePhrase({
            name: "name",
        }, this.name);
        this.description = info.description;
        this.localizedDescription = new SimplePhrase({
            name: "description",
        }, this.name);
        this.argPhrases = [];
        this.subPhrases = [];
        if (Module.isPrototypeOf(info.author)) {
            this.from = info.author as Module;
            this.author = this.from.author;
        } else {
            this.author = info.author as string;
        }
        this.arguments = args;
        this.minArguments = 0;
        // Build possible argument combinations
        this.alwaysArgs = [];
        this.argCombinations = [[]];
        let alwaysArgsDone = false;
        for (const argument of this.arguments) {
            if (argument.optional) {
                alwaysArgsDone = true;
                // For optional arguments, clone all combinations, and add the optional
                // argument to the other clone, and merge the clones into one list of combinations
                const optIncludedComb = [...this.argCombinations];
                for (const combination of optIncludedComb) {
                    combination.push(argument);
                }
                this.argCombinations = [...this.argCombinations, ...optIncludedComb];
            } else {
                this.minArguments++;
                if (alwaysArgsDone) {
                    // Non-optional arguments must be added to every possible combination
                     for (const combination of this.argCombinations) {
                        combination.push(argument);
                    }
                } else {
                    this.alwaysArgs.push(argument);
                }
            }
            argument.register(this);
        }
        // Build optimal argument checking order
        this.argCheckTree = [[]];
        // TODO
        this.defaultPermission = defaultPermission || new Permission({
            name: info.name,
        }, allowEveryone);
    }

    public register(commands: Commands) {
        this.makePhrases();
        commands.registerPhrase(this.phraseGroup!);
        commands.registerPermission(this.getPermission());
        this.logger = commands.logger;
    }

    public registerParent(parent: Command) {
        this.makePhrases();
        parent.registerSubPhrase(this.phraseGroup!);
    }

    public registerArgPhrase(phrase: Phrase) {
        this.argPhrases.push(phrase);
    }

    public registerSubPhrase(phrase: Phrase) {
        this.subPhrases.push(phrase);
    }

    public getPermission() {
        return this.defaultPermission;
    }

    public rename() {
        this.name = `${this.author}-${this.name}`;
        return this.name;
    }

    public async command(context: ICommandContext): Promise<[string, { [key: string]: string }]|undefined> {
        if (this.logger) { this.logger.debug(`Command: ${context.command}`); }
        // Set to an empty array if the string is empty,
        // since the split function would return an array with an empty string, and we don't want that
        const rawArguments = context.passed === "" ? [] : context.passed.split(" ");
        if (this.logger) { this.logger.debug(`Arguments: ${rawArguments.join(", ")}`); }
        const maxArgs = this.arguments.length;
        if (rawArguments.length < this.minArguments) { return ["tooFewArguments", {
            required: (this.minArguments === maxArgs) ? maxArgs.toString() : `${this.minArguments} - ${maxArgs}`,
            supplied: rawArguments.length.toString(),
        }]; }
        if (rawArguments.length > maxArgs) {
            // Combine extra arguments if the last argument allows it
            // This allows the last argument to optionally have spaces
            if (this.arguments[this.arguments.length - 1].allowCombining) {
                for (let i = rawArguments.length - maxArgs; i > 0; i--) {
                    rawArguments.push(rawArguments.pop() + " " + rawArguments.pop());
                }
            } else {
                return ["tooManyArguments", {
                    required: (this.minArguments === maxArgs) ?
                        maxArgs.toString() : `${this.minArguments} - ${maxArgs}`,
                    supplied: rawArguments.length.toString(),
                }];
            }
        }
        const parsed: any[] = [];
        for (const argument of this.arguments) {
            const rawArgument = rawArguments.shift()!;
            if (!argument.check(rawArgument)) {
                return ["invalidArgument", { argument: rawArgument }];
            }
            parsed.push(argument.parse(rawArgument));
        }
        if (await this.defaultPermission.checkFull(context.message.member)) {
            try {
                await this.execute({...context, arguments: parsed, rawArguments});
            } catch (err) {
                return ["executionError", { error: err.toString() }];
            }
        } else {
            return ["noPermission", { command: this.name }];
        }
    }

    public abstract async execute(context: IExecutionContext): Promise<void>;

    private makePhrases() {
        this.argPhraseGroup = new PhraseGroup({
            name: "arguments",
        }, this.argPhrases);
        this.subPhraseGroup = new PhraseGroup({
            name: "subcommands",
        }, this.subPhrases);
        this.phraseGroup = new PhraseGroup({
            name: this.name,
        }, [ this.localizedDescription, this.localizedName, this.argPhraseGroup, this.subPhraseGroup ]);
    }
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
