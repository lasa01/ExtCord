import { Phrase } from "../language/phrase/phrase";
import { PhraseGroup } from "../language/phrase/phrasegroup";
import { ISimpleMap, SimplePhrase } from "../language/phrase/simplephrase";
import { TemplatePhrase, TemplateStuff } from "../language/phrase/templatephrase";
import { Module } from "../modules/module";
import { Permission } from "../permissions/permission";
import { logger } from "../util/logger";
import { Argument } from "./arguments/argument";
import { CommandPhrases } from "./commandphrases";
import { ICommandContext } from "./commands";

export abstract class Command<T extends ReadonlyArray<Argument<any, boolean>>> {
    public name: string;
    public localizedName: SimplePhrase;
    public description: string;
    public localizedDescription: SimplePhrase;
    public from?: Module;
    public author: string;
    public arguments: T;
    public minArguments: number;
    public phraseGroup: PhraseGroup;
    public combineIndex?: number;
    protected defaultPermission: Permission;
    protected argPhraseGroup: PhraseGroup;
    protected customPhraseGroup: PhraseGroup;

    constructor(info: ICommandInfo, args: T, permission: boolean|Permission = false) {
        this.name = info.name;
        this.localizedName = new SimplePhrase({
            name: "name",
        }, this.name);
        this.description = info.description;
        this.localizedDescription = new SimplePhrase({
            name: "description",
        }, this.description);
        if (info.author instanceof Module) {
            this.from = info.author;
            this.author = this.from.author;
        } else {
            this.author = info.author;
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
        for (const [index, argument] of this.arguments.entries()) {
            if (!argument.optional) {
                this.minArguments++;
            }
            if (argument.allowCombining) {
                if (this.combineIndex !== undefined) {
                    throw new Error("Combining shouldn't be allowed for more than one argument in a command");
                }
                this.combineIndex = index;
            }
            argument.register(this);
        }
        this.defaultPermission = permission instanceof Permission ? permission : new Permission({
            name: info.name,
        }, permission);
    }

    get maxArguments() {
        return this.arguments.length;
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

    public async command(context: ICommandContext): Promise<void> {
        let startTime = process.hrtime();
        logger.debug(`Command: ${context.command}`);
        if (!await this.getPermission().checkFull(context.message.member)) {
            await context.respond(CommandPhrases.noPermission, { permission: this.defaultPermission.fullName });
            return;
        }
        // Set to an empty array if the string is empty,
        // since the split function would return an array with an empty string, and we don't want that
        const rawArguments = context.passed === "" ? [] : context.passed.split(" ");
        logger.debug(`Arguments: ${rawArguments.join(", ")}`);
        const maxArgs = this.arguments.length;
        if (rawArguments.length < this.minArguments) {
            await context.respond(CommandPhrases.tooFewArguments, {
                required: (this.minArguments === maxArgs) ? maxArgs.toString() : `${this.minArguments} - ${maxArgs}`,
                supplied: rawArguments.length.toString(),
            });
            return;
        }
        if (rawArguments.length > maxArgs) {
            // Combine extra arguments if it is allowed
            // This allows one argument to optionally have spaces
            if (this.combineIndex === undefined) {
                await context.respond(CommandPhrases.tooManyArguments, {
                    required: (this.minArguments === maxArgs) ?
                        maxArgs.toString() : `${this.minArguments} - ${maxArgs}`,
                    supplied: rawArguments.length.toString(),
                });
                return;
            }
        }
        const parsed: any[] = [];
        let rawIndex = 0;
        let rawArgument: string;
        let argument: Argument<any, boolean>;
        const errorResponseFn: LinkedErrorResponse = async (phrase, stuff) => {
            await context.respond(CommandPhrases.invalidArgument, {
                argument: argument.name,
                reason: [phrase, stuff],
                supplied: rawArgument,
            });
            return true;
        };
        for (const index of this.arguments.keys()) {
            argument = this.arguments[index];
            rawArgument = rawArguments[rawIndex];
            if (rawArguments.length > maxArgs && index === this.combineIndex) {
                const diff = rawArguments.length - this.arguments.length;
                for (let i = 0; i < diff; i++) {
                    rawIndex++;
                    rawArgument += " " + rawArguments[rawIndex];
                }
            }
            const error = await argument.check(rawArgument, context, errorResponseFn);
            if (!error) {
                parsed.push(await argument.parse(rawArgument, context));
                rawIndex++;
            } else if (argument.optional) {
                parsed.push(undefined);
            } else {
                return;
            }
        }
        let timeDiff = process.hrtime(startTime);
        logger.debug(`Argument parsing took ${timeDiff[0] * 1e9 + timeDiff[1]} nanoseconds`);
        startTime = process.hrtime();
        try {
            await this.execute({
                ...context, arguments: parsed as unknown as ArgumentsParseReturns<T>, rawArguments,
            });
        } catch (err) {
            await context.respond(CommandPhrases.executionError, { error: err.stack || err.toString() });
            return;
        }
        timeDiff = process.hrtime(startTime);
        logger.debug(`Command execution took ${timeDiff[0] * 1e9 + timeDiff[1]} nanoseconds`);
    }

    public abstract async execute(context: IExecutionContext<T>): Promise<void>;
}

export interface IExecutionContext<T extends ReadonlyArray<Argument<any, boolean>>> extends ICommandContext {
    rawArguments: string[];
    arguments: ArgumentsParseReturns<T>;
}

export interface ICommandInfo {
    name: string;
    description: string;
    author: string | Module;
}

type ArgumentsParseReturns<T extends ReadonlyArray<Argument<any, boolean>>> = {
    [P in keyof T]: T[P] extends Argument<infer U, infer V> ?
        V extends false ? U : U|undefined
        : never
};

export type LinkedErrorResponse = <T extends ISimpleMap>(
    phrase: TemplatePhrase<T>, stuff: T,
) => Promise<true>;
