import { Bot } from "../Bot";
import { DEFAULT_LANGUAGE } from "../language/Languages";
import { ListPhrase } from "../language/phrase/ListPhrase";
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

/**
 * A generic abstract base class for all commands.
 * @category Command
 * @typeparam T Array of types of the arguments for the command.
 */
export abstract class Command<T extends ReadonlyArray<Argument<any, boolean, any>>> {
    /** The name the command is registered by internally. */
    public name: string;
    /** The localized, user-friendly name of the command. */
    public localizedName: SimplePhrase;
    /** The description of the command in default language. */
    public description: string;
    /** The localized, user-friendly description of the command. */
    public localizedDescription: SimplePhrase;
    /** A list of aliases for the command in default language. */
    public aliases: string[];
    /** A list of global aliases for the command in default language. */
    public globalAliases: string[];
    /** Localized aliases for the command. */
    public localizedAliases: ListPhrase;
    /** Localized global aliases for the command. */
    public localizedGlobalAliases: ListPhrase;
    /** The module the command is from, if any. */
    public from?: Module;
    /** The name of the author of the command. */
    public author: string;
    /** Bitflag for the Discord permissions the command requires. */
    public discordPermissions: number;
    /** An array of the arguments of the command. */
    public arguments: T;
    /** A computed minimum number of arguments the command requires. */
    public minArguments: number;
    /** The full name of the command, including possible parents, seperated by spaces. */
    public fullName: string;
    /** The parent command the command is a subcommand of, if any. */
    public parent?: Command<any>;
    /** The phrase group of the command for registration purposes. */
    public phraseGroup: PhraseGroup;
    /** A computed index of [[arguments]] where combining extra arguments should happen. */
    public combineIndex?: number;
    protected defaultPermission: Permission;
    protected argPhraseGroup: PhraseGroup;
    protected customPhraseGroup: PhraseGroup;
    protected usageCache: Map<string, string>;
    protected shortUsageCache: Map<string, string>;
    private allowedPrivileges: string[];

    /**
     * Creates a new command.
     * @param info Defines basic command parameters.
     * @param args Defines arguments for the command.
     * @param permission Optionally defines the permission checked when executing the command.
     */
    constructor(info: ICommandInfo, args: T, permission?: Permission) {
        this.name = typeof info.name === "string" ? info.name : info.name[DEFAULT_LANGUAGE];
        this.localizedName = new SimplePhrase({
            name: "name",
        }, info.name);
        this.description = typeof info.description === "string" ? info.description : info.description[DEFAULT_LANGUAGE];
        this.localizedDescription = new SimplePhrase({
            name: "description",
        }, info.description);
        this.aliases = Array.isArray(info.aliases) ? info.aliases : info.aliases ? info.aliases[DEFAULT_LANGUAGE] : [];
        this.globalAliases = Array.isArray(info.globalAliases) ?
            info.globalAliases : info.globalAliases ? info.globalAliases[DEFAULT_LANGUAGE] : [];
        this.localizedAliases = new ListPhrase({
            name: "aliases",
        }, info.aliases);
        this.localizedGlobalAliases = new ListPhrase({
            name: "globalAliases",
        }, info.globalAliases);
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
        this.fullName = this.name;
        this.defaultPermission = permission instanceof Permission ? permission : new Permission({
            name: this.name,
        });
        this.allowedPrivileges = [];
        if (info.allowedPrivileges) {
            for (const privilege of info.allowedPrivileges) {
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

    /** Gets the maximum number of arguments the command accepts. */
    public get maxArguments() {
        return this.arguments.length;
    }

    /**
     * Registers the command for the specified parent.
     * @param parent The parent to register the command for.
     */
    public registerParent(parent: Command<any>) {
        this.parent = parent;
        // Global aliases are only needed if this is a subcommand
        this.phraseGroup.addPhrases(this.localizedGlobalAliases);
    }

    /** Unregisters the command for a previously registered parent. */
    public unregisterParent() {
        this.parent = undefined;
    }

    /** Updates the full name of the command to include the parent's name. */
    public updateFullName() {
        if (this.parent) {
            this.fullName = this.parent.fullName + " " + this.name;
        }
    }

    /**
     * Registers the command for the specified bot.
     * @param bot The bot to register the command for.
     */
    public registerSelf(bot: Bot) {
        for (const name of this.allowedPrivileges) {
            const privilege = bot.permissions.getBuiltinPrivilege(name);
            if (privilege) {
                privilege.allowPermissions(this.defaultPermission);
            } else {
                Logger.warn(`Command specified a nonexistent privilege ${name}`);
            }
        }
        if (this.parent === undefined && this.globalAliases.length !== 0) {
            Logger.warn(`Global aliases registered for a non-subcommand "${this.name}". Use aliases instead.`);
        }
    }

    /**
     * Associate phrases with the command.
     * @param phrases Phrases to add.
     */
    public addPhrases(...phrases: Phrase[]) {
        this.customPhraseGroup.addPhrases(...phrases);
    }

    /**
     * Remove associated phrases from the command.
     * @param phrases Phrases to remove.
     */
    public removePhrases(...phrases: Phrase[]) {
        this.customPhraseGroup.removePhrases(...phrases);
    }

    /**
     * Associate phrases with the command's arguments.
     * @param phrases Phrases to add.
     */
    public addArgPhrases(...phrases: Phrase[]) {
        this.argPhraseGroup.addPhrases(...phrases);
    }

    /**
     * Remove associated phrases from the command's arguments.
     * @param phrases Phrases to remove.
     */
    public removeArgPhrases(...phrases: Phrase[]) {
        this.argPhraseGroup.removePhrases(...phrases);
    }

    /** Get the permission of the command for registration purposes. */
    public getPermission() {
        return this.defaultPermission;
    }

    /**
     * Checks whether the specified member is allowed to execute the command.
     * @param member The member to check permissions for.
     */
    public async canExecute(member: IExtendedMember) {
        return this.defaultPermission.checkMember(member);
    }

    /**
     * Invokes the command execution.
     * This ensures permissions, parses the arguments and executes the command.
     * @param context Context of the command.
     */
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
                commandUsage: this.getShortUsage(context.language, context.prefix),
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
                    commandUsage: this.getShortUsage(context.language, context.prefix),
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
            if (rawArgument === undefined) {
                // Argument must be optional here, since argument amount handling catches the problem
                // if the argument is not optional and there are not enough arguments
                parsed.push(undefined);
                continue;
            }
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
                    commandUsage: this.getShortUsage(context.language, context.prefix),
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

    /**
     * Executes the command.
     * @param context Context of the execution.
     */
    public abstract execute(context: IExecutionContext<T>): Promise<void>;

    /**
     * Gets the localized full name for the given language.
     * @param language The language to use.
     */
    public getUsageName(language: string): string {
        const name = this.localizedName.get(language);
        return this.parent ? (this.parent.getUsageName(language) + " " + name) : name;
    }

    /**
     * Gets the localized usage string for the given language.
     * @param language The language to use.
     */
    public getUsage(language: string, prefix: string): string {
        if (this.usageCache.has(language)) {
            return this.usageCache.get(language)!;
        }
        const usage = CommandPhrases.commandUsage.format(language, {
            argumentsUsage: this.arguments.map((arg) => arg.getUsage(language)).join("\n"),
            description: this.localizedDescription,
            shortUsage: this.getShortUsage(language, prefix),
        });
        this.usageCache.set(language, usage);
        return usage;
    }

    /**
     * Gets the localized short usage string for the given language.
     * @param language The language to use.
     */
    public getShortUsage(language: string, prefix: string): string {
        const args = this.arguments.map((arg) => arg.getUsageName(language));
        args.unshift(this.getUsageName(language));
        return "`" + prefix + args.join(" ") + "`";
    }

    /**
     * Gets a map of localized aliases for the given language.
     * @param language The language to use.
     */
    public getAliases(language: string): { [key: string]: Command<any> } {
        const aliases: { [key: string]: Command<any> } = {};
        for (const alias of this.localizedAliases.get(language)) {
            aliases[alias] = this;
        }
        return aliases;
    }

    /**
     * Gets a map of localized global aliases for the given language.
     * @param language The language to use.
     */
    public getGlobalAliases(language: string): { [key: string]: Command<any> } {
        const aliases: { [key: string]: Command<any> } = {};
        for (const alias of this.localizedGlobalAliases.get(language)) {
            aliases[alias] = this;
        }
        return aliases;
    }

    /**
     * Respond to the specified command context with a help message for the command.
     * @param context The command context to send help to.
     */
    public respondHelp(context: ICommandContext) {
        return context.respond(CommandPhrases.commandHelp, {
            command: this.getUsageName(context.language),
            usage: this.getUsage(context.language, context.prefix),
        });
    }
}

/**
 * An object providing context to command execution, such as the original message, a response function and so on.
 * Also contains parsed arguments.
 * @category Command
 * @typeparam T Array of types of the arguments for the command associated with this context.
 */
export interface IExecutionContext<T extends ReadonlyArray<Argument<any, boolean, any>>> extends ICommandContext {
    /** Array of the raw passed argument strings before parsing. */
    rawArguments: string[];
    /** Array of the arguments after parsing. */
    arguments: ArgumentsParseReturns<T>;
}

/**
 * Defines basic command parameters common to all commands.
 * @category Command
 */
export interface ICommandInfo {
    /**
     * Name of the command.
     * Can be either a string, in which case it is assumed to be in [[DEFAULT_LANGUAGE]],
     * or an object, in which case the keys are languages and the values are associated localized names.
     */
    name: string | Record<string, string>;
    /**
     * Description of the command.
     * Can be either a string, in which case it is assumed to be in [[DEFAULT_LANGUAGE]],
     * or an object, in which case the keys are languages and the values are associated localized descriptions.
     */
    description: string | Record<string, string>;
    /** Specifies the source of the command, either a [[Module]] or the name of the author. */
    author: string | Module;
    /**
     * Specifies default aliases for the command.
     * Can be either an array, in which case they are assumed to be in [[DEFAULT_LANGUAGE]],
     * or an object in which case the keys are languages and the values are associated localized aliases.
     */
    aliases?: string[] | Record<string, string[]>;
    /**
     * Specifies default global aliases for the command.
     * Can be either an array, in which case they are assumed to be in [[DEFAULT_LANGUAGE]],
     * or an object in which case the keys are languages and the values are associated localized global aliases.
     */
    globalAliases?: string[] | Record<string, string[]>;
    /**
     * Specifies the privileges that are allowed to execute this command by default.
     * Both privilege instances and names can be used.
     */
    allowedPrivileges?: Array<string|PermissionPrivilege>;
    /** Bitflag for the Discord permissions the command requires. */
    discordPermissions?: number;
}

/**
 * Represents the array returned from argument parsing of the specified type of arguments.
 * @typeparam T The type of the arguments.
 * @category Command
 */
type ArgumentsParseReturns<T extends ReadonlyArray<Argument<any, boolean, any>>> = {
    [P in keyof T]: T[P] extends Argument<infer U, infer V, any> ?
        V extends false ? U : U|undefined
        : never
};

/**
 * A function that responds to the command with the specified error message.
 * @category Command
 */
export interface ILinkedErrorResponse {
    <T extends Record<string, string>>(phrase: TemplatePhrase<T>, stuff: T): undefined;
    (phrase: SimplePhrase): undefined;
}

/**
 * Represents the arguments passed to [[ILinkedErrorResponse]].
 * @category Command
 */
export type LinkedErrorArgs<T extends Record<string, string>> = [TemplatePhrase<T>, T];
