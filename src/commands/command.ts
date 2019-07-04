import { Logger } from "winston";

import { Phrase } from "../language/phrase/phrase";
import { PhraseGroup } from "../language/phrase/phrasegroup";
import { SimplePhrase } from "../language/phrase/simplephrase";
import { Module } from "../modules/module";
import { Permission } from "../permissions/permission";
import { Argument } from "./arguments/argument";
import { CommandGroup } from "./commandgroup";
import { CommandPhrases } from "./commandphrases";
import { Commands, ICommandContext } from "./commands";

export abstract class Command<T extends ReadonlyArray<Argument<any>>> {
    public name: string;
    public localizedName: SimplePhrase;
    public description: string;
    public localizedDescription: SimplePhrase;
    public from?: Module;
    public author: string;
    public arguments: T;
    public phraseGroup: PhraseGroup;
    private minArguments: number;
    private defaultPermission: Permission;
    private argPhraseGroup: PhraseGroup;
    private customPhraseGroup: PhraseGroup;
    private alwaysArgs: Array<Argument<any>>;
    private argCombinations: Array<Array<Argument<any>>>;
    private logger?: Logger;

    constructor(info: ICommandInfo, args: T, allowEveryone = false, defaultPermission?: Permission) {
        this.name = info.name;
        this.localizedName = new SimplePhrase({
            name: "name",
        }, this.name);
        this.description = info.description;
        this.localizedDescription = new SimplePhrase({
            name: "description",
        }, this.description);
        if (Module.isPrototypeOf(info.author)) {
            this.from = info.author as Module;
            this.author = this.from.author;
        } else {
            this.author = info.author as string;
        }
        this.argPhraseGroup = new PhraseGroup({
            name: "arguments",
        });
        this.customPhraseGroup = new PhraseGroup({
            name: "phrases",
        });
        this.phraseGroup = new PhraseGroup({
            name: this.name,
        }, [ this.localizedDescription, this.localizedName, this.argPhraseGroup, this.customPhraseGroup ]);
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
        // TODO
        this.defaultPermission = defaultPermission || new Permission({
            name: info.name,
        }, allowEveryone);
    }

    public register(commands: Commands) {
        commands.registerPermission(this.getPermission());
        this.logger = commands.logger;
    }

    public unregister(commands: Commands) {
        commands.unregisterPermission(this.getPermission());
    }

    public registerParent(parent: CommandGroup) {
        parent.registerSubPhrase(this.phraseGroup);
    }

    public unregisterParent(parent: CommandGroup) {
        parent.unregisterSubPhrase(this.phraseGroup);
    }

    public registerPhrase(phrase: Phrase) {
        this.customPhraseGroup.addPhrase(phrase);
    }

    public registerArgPhrase(phrase: Phrase) {
        this.argPhraseGroup.addPhrase(phrase);
    }

    public getPermission() {
        return this.defaultPermission;
    }

    public rename() {
        this.name = `${this.author}-${this.name}`;
        return this.name;
    }

    public async command(context: ICommandContext): Promise<void> {
        if (this.logger) { this.logger.debug(`Command: ${context.command}`); }
        // Set to an empty array if the string is empty,
        // since the split function would return an array with an empty string, and we don't want that
        const rawArguments = context.passed === "" ? [] : context.passed.split(" ");
        if (this.logger) { this.logger.debug(`Arguments: ${rawArguments.join(", ")}`); }
        const maxArgs = this.arguments.length;
        if (rawArguments.length < this.minArguments) {
            await context.respond(CommandPhrases.tooFewArguments, {
                required: (this.minArguments === maxArgs) ? maxArgs.toString() : `${this.minArguments} - ${maxArgs}`,
                supplied: rawArguments.length.toString(),
            });
            return;
        }
        if (rawArguments.length > maxArgs) {
            // Combine extra arguments if the last argument allows it
            // This allows the last argument to optionally have spaces
            if (this.arguments[this.arguments.length - 1].allowCombining) {
                for (let i = rawArguments.length - maxArgs; i > 0; i--) {
                    rawArguments.push(rawArguments.pop() + " " + rawArguments.pop());
                }
            } else {
                await context.respond(CommandPhrases.tooManyArguments, {
                    required: (this.minArguments === maxArgs) ?
                        maxArgs.toString() : `${this.minArguments} - ${maxArgs}`,
                    supplied: rawArguments.length.toString(),
                });
                return;
            }
        }
        const parsed: any[] = [];
        for (const argument of this.arguments) {
            const rawArgument = rawArguments.shift()!;
            if (!await argument.check(rawArgument, context)) {
                return;
            }
            parsed.push(await argument.parse(rawArgument, context));
        }
        try {
            await this.execute({
                ...context, arguments: parsed as unknown as ArgumentsParseReturns<T>, rawArguments,
            });
        } catch (err) {
            await context.respond(CommandPhrases.executionError, { error: err.toString() });
            return;
        }
    }

    public abstract async execute(context: IExecutionContext<T>): Promise<void>;
}

export interface IExecutionContext<T extends ReadonlyArray<Argument<any>>> extends ICommandContext {
    rawArguments: string[];
    arguments: ArgumentsParseReturns<T>;
}

export interface ICommandInfo {
    name: string;
    description: string;
    author: string | Module;
}

type ArgumentsParseReturns<T extends ReadonlyArray<Argument<any>>> = {
    [P in keyof T]: T[P] extends Argument<infer U> ? U : never
};
