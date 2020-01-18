import { Bot } from "../Bot";
import { DEFAULT_LANGUAGE } from "../language/Languages";
import { IListMap, ListPhrase } from "../language/phrase/ListPhrase";
import { Phrase } from "../language/phrase/Phrase";
import { PhraseGroup } from "../language/phrase/PhraseGroup";
import { SimplePhrase } from "../language/phrase/SimplePhrase";
import { TemplatePhrase } from "../language/phrase/TemplatePhrase";
import { Module } from "../modules/Module";
import { Permission } from "../permissions/Permission";
import { PermissionPrivilege } from "../permissions/PermissionPrivilege";
import { Logger } from "../util/Logger";
import { IExtendedMember } from "../util/Types";
import { Argument } from "./arguments/Argument";
import { CommandPhrases } from "./CommandPhrases";
import { ICommandContext } from "./Commands";

import { Permissions as DiscordPermissions } from "discord.js";

export abstract class Command<T extends ReadonlyArray<Argument<any, boolean, any>>> {
    public name: string;
    public localizedName: SimplePhrase;
    public description: string;
    public localizedDescription: SimplePhrase;
    public aliases: string[];
    public localizedAliases: ListPhrase;
    public from?: Module;
    public author: string;
    public discordPermissions: number;
    public arguments: T;
    public minArguments: number;
    public parent?: Command<any>;
    public phraseGroup: PhraseGroup;
    public combineIndex?: number;
    protected defaultPermission: Permission;
    protected argPhraseGroup: PhraseGroup;
    protected customPhraseGroup: PhraseGroup;
    private allowedPrivileges: string[];
    private usageCache: Map<string, string>;
    private shortUsageCache: Map<string, string>;

    constructor(info: ICommandInfo, args: T,  allowed?: Array<string|PermissionPrivilege>, permission?: Permission) {
        this.name = typeof info.name === "string" ? info.name : info.name[DEFAULT_LANGUAGE];
        this.localizedName = new SimplePhrase({
            name: "name",
        }, info.name);
        this.description = typeof info.description === "string" ? info.description : info.description[DEFAULT_LANGUAGE];
        this.localizedDescription = new SimplePhrase({
            name: "description",
        }, info.description);
        this.aliases = Array.isArray(info.aliases) ? info.aliases : info.aliases ? info.aliases[DEFAULT_LANGUAGE] : [];
        this.localizedAliases = new ListPhrase({
            name: "aliases",
        }, info.aliases);
        if (info.author instanceof Module) {
            this.from = info.author;
            this.author = this.from.author;
        } else {
            this.author = info.author;
        }
        this.discordPermissions = info.discordPermissions ?? 0;
        this.argPhraseGroup = new PhraseGroup({
            name: "arguments",
        });
        this.customPhraseGroup = new PhraseGroup({
            name: "phrases",
        });
        this.phraseGroup = new PhraseGroup({ name: this.name }, [
            this.localizedDescription,
            this.localizedName,
            this.localizedAliases,
            this.argPhraseGroup,
            this.customPhraseGroup,
        ]);
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
            argument.registerSelf(this);
        }
        this.defaultPermission = permission instanceof Permission ? permission : new Permission({
            name: this.name,
        });
        this.allowedPrivileges = [];
        if (allowed) {
            for (const privilege of allowed) {
                if (typeof privilege === "string") {
                    // Process privilege later
                    this.allowedPrivileges.push(privilege);
                } else {
                    privilege.allowPermissions(this.defaultPermission);
                }
            }
        }
        this.usageCache = new Map();
        this.shortUsageCache = new Map();
    }

    public get maxArguments() {
        return this.arguments.length;
    }

    public registerParent(parent: Command<any>) {
        this.parent = parent;
    }

    public unregisterParent() {
        this.parent = undefined;
    }

    public registerSelf(bot: Bot) {
        for (const name of this.allowedPrivileges) {
            const privilege = bot.permissions.getBuiltinPrivilege(name);
            if (privilege) {
                privilege.allowPermissions(this.defaultPermission);
            } else {
                Logger.warn(`Command specified a nonexistent privilege ${name}`);
            }
        }
    }

    public addPhrases(...phrases: Phrase[]) {
        this.customPhraseGroup.addPhrases(...phrases);
    }

    public removePhrases(...phrases: Phrase[]) {
        this.customPhraseGroup.removePhrases(...phrases);
    }

    public addArgPhrases(...phrases: Phrase[]) {
        this.argPhraseGroup.addPhrases(...phrases);
    }

    public removeArgPhrases(...phrases: Phrase[]) {
        this.argPhraseGroup.removePhrases(...phrases);
    }

    public getPermission() {
        return this.defaultPermission;
    }

    public async canExecute(member: IExtendedMember) {
        return this.defaultPermission.checkMember(member);
    }

    public async command(context: ICommandContext): Promise<void> {
        let startTime = process.hrtime();
        Logger.debug(`(command ${this.name}) Command: ${context.command}`);
        const needBit = this.discordPermissions;
        if (needBit !== 0) {
            const botBit = context.botPermissions.bitfield;
            // Bitwise XOR the permissions to get permissions which one has, other doesn't
            // Then bitwise AND with needBit to get permissions that are different which are also needed
            // Result is bot's missing permissions
            // tslint:disable-next-line:no-bitwise
            const missingPermissions = (needBit ^ botBit) & needBit;
            // Admin overrides permissions, needs to be checked
            if (missingPermissions !== 0 && !context.botPermissions.has(DiscordPermissions.FLAGS.ADMINISTRATOR!)) {
                return context.respond(CommandPhrases.botNoPermission, {
                    permissions: new DiscordPermissions(missingPermissions).toArray(false).join(", "),
                });
            }
        }
        if (!await this.canExecute(context.message.member)) {
            await context.respond(CommandPhrases.noPermission, { permission: this.defaultPermission.fullName });
            return;
        }
        // Set to an empty array if the string is empty,
        // since the split function would return an array with an empty string, and we don't want that
        const rawArguments = context.passed === "" ? [] : context.passed.split(" ");
        Logger.debug(`(command ${this.name}) Arguments: ${rawArguments.join(", ")}`);
        const maxArgs = this.arguments.length;
        if (rawArguments.length < this.minArguments) {
            await context.respond(CommandPhrases.tooFewArguments, {
                commandUsage: this.getShortUsage(context.language),
                // TODO can be defined for the Command instance
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
                    commandUsage: this.getShortUsage(context.language),
                    // TODO can be defined for the Command instance
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
        let argument: Argument<any, boolean, any>;
        let errorStuff: LinkedErrorArgs<Record<string, string>>|SimplePhrase|undefined;
        const errorResponseFn: ILinkedErrorResponse =
        <U extends Record<string, string>>(phrase: TemplatePhrase<U>|SimplePhrase, stuff?: U): undefined => {
            errorStuff = stuff ? [phrase as TemplatePhrase<U>, stuff] : phrase;
            return;
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
            const passed = await argument.check(rawArgument, context, errorResponseFn);
            if (passed !== undefined) {
                parsed.push(await argument.parse(rawArgument, context, passed));
                rawIndex++;
            } else if (argument.optional) {
                parsed.push(undefined);
            } else {
                return context.respond(CommandPhrases.invalidArgument, {
                    argument: argument.name,
                    argumentUsage: argument.getUsage(context.language),
                    commandUsage: this.getShortUsage(context.language),
                    reason: errorStuff ?? "",
                    supplied: rawArgument,
                });
            }
        }
        let timeDiff = process.hrtime(startTime);
        let timeString = ((timeDiff[0] * 1e9 + timeDiff[1]) / 1000000).toFixed(3);
        Logger.debug(`(command ${this.name}) Argument parsing took ${timeString} ms`);
        startTime = process.hrtime();
        try {
            await this.execute({
                ...context, arguments: parsed as unknown as ArgumentsParseReturns<T>, rawArguments,
            });
        } catch (err) {
            const error = err.stack ?? err.toString();
            await context.respond(CommandPhrases.executionError, { error });
            Logger.error(`(command ${this.name}) An unexpected error occured: ${error}`);
            return;
        }
        timeDiff = process.hrtime(startTime);
        timeString = ((timeDiff[0] * 1e9 + timeDiff[1]) / 1000000).toFixed(3);
        Logger.debug(`(command ${this.name}) Command execution took ${timeString} ms`);
    }

    public abstract async execute(context: IExecutionContext<T>): Promise<void>;

    public getUsageName(language: string): string {
        const name = this.localizedName.get(language);
        return this.parent ? (this.parent.getUsageName(language) + " " + name) : name;
    }

    public getUsage(language: string): string {
        if (this.usageCache.has(language)) {
            return this.usageCache.get(language)!;
        }
        const usage = CommandPhrases.commandUsage.format(language, {
            arguments: this.arguments.map((arg) => arg.getUsageName(language)).join(" "),
            argumentsUsage: this.arguments.map((arg) => arg.getUsage(language)).join("\n"),
            command: this.getUsageName(language),
            description: this.localizedDescription,
        });
        this.usageCache.set(language, usage);
        return usage;
    }

    public getShortUsage(language: string): string {
        if (this.shortUsageCache.has(language)) {
            return this.shortUsageCache.get(language)!;
        }
        const usage = CommandPhrases.commandUsageShort.format(language, {
            arguments: this.arguments.map((arg) => arg.getUsageName(language)).join(" "),
            command: this.getUsageName(language),
        });
        this.shortUsageCache.set(language, usage);
        return usage;
    }

    public getAliases(language: string): { [key: string]: Command<any> } {
        const aliases: { [key: string]: Command<any> } = {};
        for (const alias of this.localizedAliases.get(language)) {
            aliases[alias] = this;
        }
        return aliases;
    }
}

export interface IExecutionContext<T extends ReadonlyArray<Argument<any, boolean, any>>> extends ICommandContext {
    rawArguments: string[];
    arguments: ArgumentsParseReturns<T>;
}

export interface ICommandInfo {
    name: string | Record<string, string>;
    description: string | Record<string, string>;
    author: string | Module;
    aliases?: string[] | IListMap;
    discordPermissions?: number;
}

type ArgumentsParseReturns<T extends ReadonlyArray<Argument<any, boolean, any>>> = {
    [P in keyof T]: T[P] extends Argument<infer U, infer V, any> ?
        V extends false ? U : U|undefined
        : never
};

export interface ILinkedErrorResponse {
    <T extends Record<string, string>>(phrase: TemplatePhrase<T>, stuff: T): undefined;
    (phrase: SimplePhrase): undefined;
}

export type LinkedErrorArgs<T extends Record<string, string>> = [TemplatePhrase<T>, T];
