import { Message } from "discord.js";
import { EventEmitter } from "events";
import { Logger } from "winston";

import { Config } from "../config/config";
import { ConfigEntryGroup } from "../config/entry/entrygroup";
import { StringGuildConfigEntry } from "../config/entry/guild/stringguildentry";
import { Database } from "../database/database";
import { Languages } from "../language/languages";
import { DynamicFieldMessagePhrase } from "../language/phrase/dynamicfieldmessagephrase";
import { MessagePhrase } from "../language/phrase/messagephrase";
import { Phrase } from "../language/phrase/phrase";
import { PhraseGroup } from "../language/phrase/phrasegroup";
import { Permission } from "../permissions/permission";
import { PermissionGroup } from "../permissions/permissiongroup";
import { Permissions } from "../permissions/permissions";
import { BuiltInArguments } from "./arguments/builtinarguments";
import { Command } from "./command";
import { CommandPhrases } from "./commandphrases";

// Event definitions
// tslint:disable-next-line:interface-name
export interface Commands {
    /** @event */
    addListener(event: "command", listener: (command: Command<any>, context: ICommandContext) => void): this;
    /** @event */
    emit(event: "command", command: Command<any>, context: ICommandContext): boolean;
    /** @event */
    on(event: "command", listener: (command: Command<any>, context: ICommandContext) => void): this;
    /** @event */
    once(event: "command", listener: (command: Command<any>, context: ICommandContext) => void): this;
    /** @event */
    prependListener(event: "command", listener: (command: Command<any>, context: ICommandContext) => void): this;
    /** @event */
    prependOnceListener(event: "command", listener: (command: Command<any>, context: ICommandContext) => void): this;
}

export class Commands extends EventEmitter {
    public prefixConfigEntry?: StringGuildConfigEntry;
    public logger: Logger;
    private languages: Languages;
    private commands: Map<string, Command<any>>;
    private configEntry?: ConfigEntryGroup;
    private permissions: Permission[];
    private permission?: Permission;
    private commandPhrases: Phrase[];
    private commandPhraseGroup?: PhraseGroup;
    private argumentsGroup?: PhraseGroup;
    private phrasesGroup?: PhraseGroup;
    private phraseGroup?: PhraseGroup;

    constructor(logger: Logger, languages: Languages) {
        super();
        this.logger = logger;
        this.languages = languages;
        this.commands = new Map();
        this.permissions = [];
        this.commandPhrases = [];
    }

    public async message(message: Message) {
        if (!message.guild || message.author.bot) { return; } // For now
        const prefix = await this.prefixConfigEntry!.guildGet(message.guild);
        const mention = `<@${message.client.user.id}>`;
        let text;
        if (message.content.startsWith(prefix)) {
            text = message.content.replace(prefix, "").trim();
        } else if (message.content.startsWith(mention)) {
            text = message.content.replace(mention, "").trim();
        } else {
            return;
        }
        const command = text.split(" ", 1)[0];
        const language = await this.languages.getLanguage(message.guild);
        const useEmbeds = await this.languages.useEmbedsConfigEntry!.guildGet(message.guild);
        const useMentions = await this.languages.useMentionsConfigEntry!.guildGet(message.guild);
        const respond = async <T extends { [key: string]: string }, U extends { [key: string]: string }>
            (phrase: MessagePhrase<T> | DynamicFieldMessagePhrase<T, U>, stuff?: T, fieldStuff?: U[]) => {
            if (useMentions) {
                await message.reply(useEmbeds ? "" : phrase.format(language, stuff, fieldStuff),
                useEmbeds ? { embed: phrase.formatEmbed(language, stuff, fieldStuff) } : undefined);
            } else {
                await message.channel.send(useEmbeds ? "" : phrase.format(language, stuff, fieldStuff),
                useEmbeds ? { embed: phrase.formatEmbed(language, stuff, fieldStuff) } : undefined);
            }
        };
        if (!command || !this.commands.has(command)) {
            await respond(CommandPhrases.invalidCommand, { command });
            return;
        }
        const commandInstance = this.commands.get(command)!;
        if (!await commandInstance.getPermission().checkFull(message.member)) {
            await respond(CommandPhrases.noPermission, { command });
            return;
        }
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
        await commandInstance.command(context);
    }

    public register(command: Command<any>) {
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

    public unregister(command: Command<any>) {
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
            description: "Built-in commands",
            name: "commands",
        }, this.commandPhrases);
        this.argumentsGroup = new PhraseGroup({
            description: "Built-in arguments",
            name: "arguments",
        }, Object.values(BuiltInArguments).map((arg) => arg.getPhrase()));
        this.phrasesGroup = new PhraseGroup({
            description: "Built-in phrases",
            name: "phrases",
        }, Object.values(CommandPhrases));
        this.phraseGroup = new PhraseGroup({
            name: "commands",
        }, [ this.argumentsGroup, this.commandPhraseGroup, this.phrasesGroup ]);
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
    respond: <T extends { [key: string]: string }, U extends { [key: string]: string }>
        (phrase: MessagePhrase<T> | DynamicFieldMessagePhrase<T, U>, stuff?: T, fieldStuff?: U[]) => Promise<void>;
}
