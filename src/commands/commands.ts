import { Message } from "discord.js";
import { EventEmitter } from "events";
import { Logger } from "winston";

import { Config } from "../config/config";
import { ConfigEntryGroup } from "../config/entry/entrygroup";
import { StringGuildConfigEntry } from "../config/entry/guild/stringguildentry";
import { Database } from "../database/database";
import { Languages } from "../language/languages";
import { MessagePhrase } from "../language/phrase/messagephrase";
import { Phrase } from "../language/phrase/phrase";
import { PhraseGroup } from "../language/phrase/phrasegroup";
import { Permission } from "../permissions/permission";
import { PermissionGroup } from "../permissions/permissiongroup";
import { Permissions } from "../permissions/permissions";
import { BuiltInArguments } from "./arguments/builtinarguments";
import { Command } from "./command";

// Event definitions
// tslint:disable-next-line:interface-name
export interface Commands {
    /** @event */
    addListener(event: "command", listener: (command: Command, context: ICommandContext) => void): this;
    /** @event */
    emit(event: "command", command: Command, context: ICommandContext): boolean;
    /** @event */
    on(event: "command", listener: (command: Command, context: ICommandContext) => void): this;
    /** @event */
    once(event: "command", listener: (command: Command, context: ICommandContext) => void): this;
    /** @event */
    prependListener(event: "command", listener: (command: Command, context: ICommandContext) => void): this;
    /** @event */
    prependOnceListener(event: "command", listener: (command: Command, context: ICommandContext) => void): this;
}

export class Commands extends EventEmitter {
    public prefixConfigEntry?: StringGuildConfigEntry;
    public logger: Logger;
    private languages: Languages;
    private commands: Map<string, Command>;
    private configEntry?: ConfigEntryGroup;
    private permissions: Permission[];
    private permission?: Permission;
    private commandPhrases: Phrase[];
    private commandPhraseGroup?: PhraseGroup;
    private phrases: {
        invalidCommand: MessagePhrase<{ command: string }>;
        executionError: MessagePhrase<{ error: string}>;
        invalidArgument: MessagePhrase<{ argument: string }>;
        noPermission: MessagePhrase<{ command: string }>;
        tooFewArguments: MessagePhrase<{ supplied: string, required: string }>;
        tooManyArguments: MessagePhrase<{ supplied: string, required: string }>;
        [key: string]: MessagePhrase<any>;
    };
    private argumentsGroup?: PhraseGroup;
    private phraseGroup?: PhraseGroup;

    constructor(logger: Logger, languages: Languages) {
        super();
        this.logger = logger;
        this.languages = languages;
        this.commands = new Map();
        this.permissions = [];
        this.commandPhrases = [];
        this.phrases = {
            executionError: new MessagePhrase({
                name: "executionError",
            }, "Execution failed: {error}", {
                description: "Encountered an unknown error.\n`{error}`",
                timestamp: false,
                title: "Command execution failed",
            }, {
                error: "The error that occured",
            }),
            invalidArgument: new MessagePhrase({
                name: "invalidArgument",
            }, "Argument `{argument}` is invalid", {
                description: "Argument `{argument}` is invalid.",
                timestamp: false,
                title: "Invalid argument",
            }, {
                argument: "The invalid argument",
            }),
            invalidCommand: new MessagePhrase({
                name: "invalidCommand",
            }, "Command {command} not found", {
                description: "Command `{command}` doesn't exist.",
                timestamp: false,
                title: "Command not found",
            }, {
                command: "The called command",
            }),
            noPermission: new MessagePhrase({
                name: "noPermission",
            }, "You lack permissions to execute the command `{command}`", {
                description: "You lack the permissions required for the command `{command}`.",
                timestamp: false,
                title: "Insufficient permissions",
            }, {
                command: "The called command",
            }),
            tooFewArguments: new MessagePhrase({
                name: "tooFewArguments",
            }, "Too few arguments supplied: {supplied} supplied, {required} required", {
                description: "The command requires {required} arguments, instead of {supplied}.",
                timestamp: false,
                title: "Too few arguments",
            }, {
                required: "The amount of required arguments",
                supplied: "The amount of supplied arguments",
            }),
            tooManyArguments: new MessagePhrase({
                name: "tooManyArguments",
            }, "Too many arguments supplied: {supplied} supplied, {required} required", {
                description: "The command requires {required} arguments, instead of {supplied}.",
                timestamp: false,
                title: "Too many arguments",
            }, {
                required: "The amount of required arguments",
                supplied: "The amount of supplied arguments",
            }),
        };
    }

    public async message(message: Message) {
        if (!message.guild) { return; } // For now
        const language = await this.languages.getLanguage(message.guild);
        const useEmbeds = await this.languages.useEmbedsConfigEntry!.guildGet(message.guild);
        const useMentions = await this.languages.useMentionsConfigEntry!.guildGet(message.guild);
        const respond = async <T extends { [key: string]: string }>(phrase: MessagePhrase<T>, stuff?: T) => {
            if (useMentions) {
                await message.reply(useEmbeds ? "" : phrase.format(language, stuff),
                useEmbeds ? { embed: phrase.formatEmbed(language, stuff) } : undefined);
            } else {
                await message.channel.send(useEmbeds ? "" : phrase.format(language, stuff),
                useEmbeds ? { embed: phrase.formatEmbed(language, stuff) } : undefined);
            }
        };
        const prefix = await this.prefixConfigEntry!.guildGet(message.guild);
        if (!message.content.startsWith(prefix)) { return; }
        const text = message.content.replace(prefix, "").trim();
        const command = text.split(" ", 1)[0];
        if (!command || !this.commands.has(command)) {
            await respond(this.phrases.invalidCommand, { command });
            return;
        }
        const commandInstance = this.commands.get(command)!;
        const passed = text.replace(command, "").trim();
        const context = {
            command,
            language,
            message,
            passed,
            prefix,
            respond,
        };
        this.logger.debug(`Executing command ${command}`);
        this.emit("command", commandInstance, context);
        const err = await commandInstance.command(context);
        if (err) {
            await respond(this.phrases[err[0]], err[1]);
        }
    }

    public register(command: Command) {
        if (this.commands.has(command.name)) {
            this.logger.warn(`Multiple commands with the same name detected, renaming "${command.name}"`);
            if (this.commands.has(command.rename())) {
                this.logger.error(`Naming conflict with "${command.name}", command ignored`);
                return;
            }
        }
        command.register(this);
        this.commands.set(command.name, command);
    }

    public unregister(command: Command) {
        command.unregister(this);
        this.commands.delete(command.name);
    }

    public registerPermission(permission: Permission) {
        this.permissions.push(permission);
    }

    public unregisterPermission(permission: Permission) {
        this.permissions.splice(this.permissions.indexOf(permission), 1);
    }

    public registerPhrase(phrase: Phrase) {
        this.commandPhrases.push(phrase);
    }

    public unregisterPhrase(phrase: Phrase) {
        this.commandPhrases.splice(this.commandPhrases.indexOf(phrase), 1);
    }

    public registerConfig(config: Config, database: Database) {
        this.prefixConfigEntry = new StringGuildConfigEntry({
            description: "The prefix for commands",
            name: "prefix",
        }, database, "!");
        this.configEntry = new ConfigEntryGroup({
            name: "commands",
        }, [ this.prefixConfigEntry ]);
        config.register(this.configEntry);
    }

    public registerPermissions(permissions: Permissions) {
        this.permission = new PermissionGroup({
            description: "Permissions for command execution",
            name: "commands",
        }, this.permissions);
        permissions.register(this.permission);
    }

    public registerLanguages() {
        this.commandPhraseGroup = new PhraseGroup({
            description: "Language definitions for individual commands",
            name: "commands",
        }, this.commandPhrases);
        this.argumentsGroup = new PhraseGroup({
            description: "Built-in arguments",
            name: "arguments",
        }, Object.values(BuiltInArguments).map((arg) => arg.getPhrase()));
        this.phraseGroup = new PhraseGroup({
            name: "commands",
        }, [ this.argumentsGroup, ...Object.values(this.phrases), this.commandPhraseGroup ]);
        this.languages.register(this.phraseGroup);
    }

    public getStatus() {
        return `${this.commands.size} commands loaded: ${Array.from(this.commands.keys()).join(", ")}`;
    }
}

export interface ICommandContext {
    prefix: string;
    message: Message;
    command: string;
    passed: string;
    language: string;
    respond: <T extends { [key: string]: string }>(phrase: MessagePhrase<T>, stuff?: T) => Promise<void>;
}
