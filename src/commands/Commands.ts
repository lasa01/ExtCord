import { Message, Permissions as DiscordPermissions } from "discord.js";
import { EventEmitter } from "events";
import { readdir } from "fs-extra";
import { resolve } from "path";

import { Repository } from "typeorm";
import { Bot } from "../Bot";
import { ConfigEntryGroup } from "../config/entry/ConfigEntryGroup";
import { StringGuildConfigEntry } from "../config/entry/guild/StringGuildConfigEntry";
import { MemberRepository } from "../database/repo/MemberRepository";
import { DynamicFieldMessagePhrase, TemplateStuffs } from "../language/phrase/DynamicFieldMessagePhrase";
import { MessagePhrase } from "../language/phrase/MessagePhrase";
import { Phrase } from "../language/phrase/Phrase";
import { PhraseGroup } from "../language/phrase/PhraseGroup";
import { TemplateStuff } from "../language/phrase/TemplatePhrase";
import { Permission } from "../permissions/Permission";
import { PermissionGroup } from "../permissions/PermissionGroup";
import { Logger } from "../util/Logger";
import { IExtendedGuild, IExtendedMessage } from "../util/Types";
import { BuiltInArguments } from "./arguments/BuiltinArguments";
import { Command } from "./Command";
import { CommandGroup } from "./CommandGroup";
import { CommandPhrases } from "./CommandPhrases";
import { GuildAliasEntity } from "./database/GuildAliasEntity";

// Event definitions
// tslint:disable-next-line:interface-name
export interface Commands {
    /** @event */
    addListener(event: "command", listener: (command: Command<any>, context: ICommandContext) => void): this;
    /** @event */
    addListener(event: "message", listener: (message: IExtendedMessage) => void): this;
    /** @event */
    emit(event: "command", command: Command<any>, context: ICommandContext): boolean;
    /** @event */
    emit(event: "message", message: IExtendedMessage): boolean;
    /** @event */
    on(event: "command", listener: (command: Command<any>, context: ICommandContext) => void): this;
    /** @event */
    on(event: "message", listener: (message: IExtendedMessage) => void): this;
    /** @event */
    once(event: "command", listener: (command: Command<any>, context: ICommandContext) => void): this;
    /** @event */
    once(event: "message", listener: (message: IExtendedMessage) => void): this;
    /** @event */
    prependListener(event: "command", listener: (command: Command<any>, context: ICommandContext) => void): this;
    /** @event */
    prependListener(event: "message", listener: (message: IExtendedMessage) => void): this;
    /** @event */
    prependOnceListener(event: "command", listener: (command: Command<any>, context: ICommandContext) => void): this;
    /** @event */
    prependOnceListener(event: "message", listener: (message: IExtendedMessage) => void): this;
}

/**
 * The bot's handler for command registering and invoking.
 * @category Command
 */
export class Commands extends EventEmitter {
    /** Guild-configurable config entry for the command prefix. */
    public prefixConfigEntry: StringGuildConfigEntry;
    /** Database repositories used by commands. */
    public repos?: {
        alias: Repository<GuildAliasEntity>,
        member: MemberRepository,
    };
    private bot: Bot;
    private commands: Map<string, Command<any>>;
    private languageCommandsMap: Map<string, Map<string, Command<any>>>;
    private guildCommandsMap: Map<string, Map<string, Command<any>>>;
    private configEntry: ConfigEntryGroup;
    private permissions: Permission[];
    private permission?: Permission;
    private commandPhrases: Phrase[];
    private commandPhraseGroup?: PhraseGroup;
    private argumentsGroup?: PhraseGroup;
    private phrasesGroup?: PhraseGroup;
    private phraseGroup?: PhraseGroup;

    /**
     * Creates a commands handler.
     * @param bot The bot that uses the handler.
     */
    constructor(bot: Bot) {
        super();
        this.bot = bot;
        this.commands = new Map();
        this.guildCommandsMap = new Map();
        this.languageCommandsMap = new Map();
        this.permissions = [];
        this.commandPhrases = [];
        this.prefixConfigEntry = new StringGuildConfigEntry({
            description: "The prefix for commands",
            name: "prefix",
        }, this.bot.database, "!");
        this.configEntry = new ConfigEntryGroup({
            name: "commands",
        }, [ this.prefixConfigEntry ]);
    }

    /**
     * Handles the specified incoming message.
     * @param discordMessage The message to handle from Discord.
     */
    public async message(discordMessage: Message) {
        const startTime = process.hrtime();
        if (!discordMessage.guild || !discordMessage.member || discordMessage.author.bot) { return; } // For now
        // TODO this somewhere else, will be needed elsewhere
        this.ensureRepo();
        const member = await this.repos.member.getEntity(discordMessage.member);
        const author = {
            entity: member.user,
            user: discordMessage.author,
        };
        const guild = {
            entity: member.guild,
            guild: discordMessage.guild,
        };
        const message: IExtendedMessage = {
            author,
            guild,
            member: {
                entity: member,
                member: discordMessage.member,
            },
            message: discordMessage,
        };
        const prefix = await this.prefixConfigEntry.guildGet(message.guild);
        // TODO really doesn't need to be reassigned each call
        const mention = `<@${message.message.client.user!.id}>`;
        const mention2 = `<@!${message.message.client.user!.id}>`; // Discord, why?
        let text;
        if (message.message.content.startsWith(prefix)) {
            text = message.message.content.slice(prefix.length).trim();
        } else if (message.message.content.startsWith(mention)) {
            text = message.message.content.slice(mention.length).trim();
        } else if (message.message.content.startsWith(mention2)) {
            text = message.message.content.slice(mention2.length).trim();
        } else {
            // This is a normal message
            this.emit("message", message);
            return;
        }
        const language = await this.bot.languages.getLanguage(message.guild);
        const botPermissions = discordMessage.guild.me!.permissionsIn(discordMessage.channel);
        if (!botPermissions.has(DiscordPermissions.FLAGS.SEND_MESSAGES!)) {
            // Send private message telling the bot can't send messages
            return discordMessage.author.send(CommandPhrases.botNoSendPermission.get(language));
        }
        const command = text.split(" ", 1)[0];
        if (command === "") {
            // Message only includes the prefix, no command, treat as a normal message
            this.emit("message", message);
            return;
        }
        // TODO Could get both with one database query
        const useEmbeds = await this.bot.languages.useEmbedsConfigEntry.guildGet(message.guild);
        const useMentions = await this.bot.languages.useMentionsConfigEntry.guildGet(message.guild);
        // TODO maybe don't need a new function every time
        const respond: LinkedResponse = async (phrase, stuff, fieldStuff) => {
                let content: string;
                let options;
                if (useEmbeds) {
                    content = "";
                    options = {
                        embed: phrase instanceof DynamicFieldMessagePhrase ?
                            phrase.formatEmbed(language, stuff, fieldStuff) :
                            phrase.formatEmbed(language, stuff),
                    };
                } else {
                    content = phrase instanceof DynamicFieldMessagePhrase ?
                        phrase.format(language, stuff, fieldStuff) : phrase.format(language, stuff);
                    options = {};
                }
                if (useMentions) {
                    await message.message.reply(content, options);
                } else {
                    await message.message.channel.send(content, options);
                }
            };
        // TODO Optimise promise concurrency
        const commandInstance = await this.getCommandInstance(message.guild, language, command);
        if (!commandInstance) {
            await respond(CommandPhrases.invalidCommand, { command });
            return;
        }
        const passed = text.slice(command.length).trim();
        const context = {
            bot: this.bot,
            botPermissions,
            command,
            language,
            message,
            passed,
            prefix,
            respond,
        };
        const timeDiff = process.hrtime(startTime);
        Logger.debug(`Command preprocessing took ${((timeDiff[0] * 1e9 + timeDiff[1]) / 1000000).toFixed(3)} ms`);
        Logger.debug(`Executing command ${command}`);
        this.emit("command", commandInstance, context);
        await commandInstance.command(context);
    }

    /**
     * Gets the instance of the specified command by a name, taking guild aliases and language into account.
     * @param guild The guild to get commands from.
     * @param language The language to use.
     * @param command The name of the command/alias to resolve.
     */
        public async getCommandInstance(guild: IExtendedGuild, language: string, command: string) {
        return (await this.getGuildCommandsMap(guild, language)).get(command);
    }

    /**
     * Gets the instance of the specified command by a name, taking guild aliases and language into account.
     * If the command name contains spaces, this searches for a subcommand by that name recursively.
     * @param guild The guild to get commands from.
     * @param language The language to use.
     * @param command The name of the command/alias to resolve.
     */
    public async getCommandInstanceRecursive(guild: IExtendedGuild, language: string, command: string) {
        const commandParts = command.split(" ");
        let currentCommand = await this.getCommandInstance(guild, language, commandParts.shift()!);
        while (commandParts.length !== 0) {
            if (!(currentCommand instanceof CommandGroup)) {
                return undefined;
            }
            currentCommand = currentCommand.getCommandInstance(guild, language, commandParts.shift()!);
        }
        if (!currentCommand) {
            return undefined;
        }
        return currentCommand;
    }

    /**
     * Gets a map of commands for the specified guild and language.
     * @param guild The guild to create the map for.
     * @param language The language to use.
     */
    public async getGuildCommandsMap(guild: IExtendedGuild, language: string) {
        if (this.guildCommandsMap.has(guild.guild.id)) {
            return this.guildCommandsMap.get(guild.guild.id)!;
        }
        const map = new Map(this.getLanguageCommmandsMap(language));
        this.ensureRepo();
        const aliases = await this.getCustomAliases(guild);
        for (const alias of aliases) {
            if (alias.alias.includes(" ")) {
                Logger.warn(`Alias "${alias.alias}" in guild ${guild.guild.id} contains a space`);
                continue;
            }
            const commandParts = alias.command.split(" ");
            let currentCommand = this.commands.get(commandParts.shift()!);
            while (commandParts.length !== 0) {
                if (!(currentCommand instanceof CommandGroup)) {
                    Logger.warn(
                        `Alias "${alias.alias}" in guild ${guild.guild.id}` +
                        ` refers to an invalid command "${alias.command}"`,
                    );
                    continue;
                }
                currentCommand = currentCommand.getCommandInstance(guild, language, commandParts.shift()!);
            }
            if (!currentCommand) {
                Logger.warn(
                    `Alias "${alias.alias}" in guild ${guild.guild.id} refers to an invalid command "${alias.command}"`,
                );
                continue;
            }
            map.set(alias.alias, currentCommand);
        }
        this.guildCommandsMap.set(guild.guild.id, map);
        return map;
    }

    /**
     * Gets a map of commands for the specified language.
     * @param language The language to use.
     */
    public getLanguageCommmandsMap(language: string) {
        if (this.languageCommandsMap.has(language)) {
            return this.languageCommandsMap.get(language)!;
        }
        const map: Map<string, Command<any>> = new Map();
        for (const [, command] of this.commands) {
            map.set(command.localizedName.get(language), command);
            for (const [alias, aliasCommand] of Object.entries(command.getAliases(language))) {
                map.set(alias, aliasCommand);
            }
        }
        this.languageCommandsMap.set(language, map);
        return map;
    }

    /**
     * Creates or updates an alias in the specified guild.
     * @param guild The guild to set the alias for.
     * @param language The language to use.
     * @param alias The alias that is being set.
     * @param command The command the alias points to.
     */
    public async setAlias(guild: IExtendedGuild, language: string, alias: string, command: Command<any>) {
        if (alias.includes(" ")) {
            throw new Error("Trying to set an alias that contains spaces");
        }
        this.ensureRepo();
        let entity = await this.repos.alias.findOne({
            alias,
            guild: guild.entity,
        });
        if (!entity) {
            entity = this.repos.alias.create({
                alias,
                command: command.fullName,
                guild: guild.entity,
            });
        } else {
            entity.command = command.fullName;
        }
        await this.repos.alias.save(entity);
        (await this.getGuildCommandsMap(guild, language)).set(alias, command);
    }

    /**
     * Removes an alias from the specified guild.
     * @param guild The guild to remove the alias from.
     * @param language The language to use.
     * @param alias The alias that is being removed.
     */
    public async removeAlias(guild: IExtendedGuild, language: string, alias: string) {
        this.ensureRepo();
        const entity = await this.repos.alias.findOne({
            alias,
            guild: guild.entity,
        });
        if (entity) {
            await this.repos.alias.remove(entity);
        }
        (await this.getGuildCommandsMap(guild, language)).delete(alias);
    }

    /**
     * Gets custom aliases for the specified guild.
     * @param guild The guild to get aliases from.
     */
    public getCustomAliases(guild: IExtendedGuild): Promise<GuildAliasEntity[]> {
        this.ensureRepo();
        return this.repos.alias.find({
            guild: guild.entity,
        });
    }

    /**
     * Registers a command to the command handler.
     * @param command The command to register.
     */
    public registerCommand(command: Command<any>) {
        if (this.commands.has(command.name)) {
            throw new Error(`A command is already registered by the name ${command.name}`);
        }
        this.registerPermission(command.getPermission());
        command.registerSelf(this.bot);
        command.updateFullName();
        this.commands.set(command.name, command);
    }

    /**
     * Unregister a command from the command handler.
     * @param command The command to unregister.
     */
    public unregisterCommand(command: Command<any>) {
        this.unregisterPermission(command.getPermission());
        this.commands.delete(command.name);
    }

    /**
     * Registers a permission to the command handler.
     * @param permission The permission to register.
     */
    public registerPermission(permission: Permission) {
        this.permissions.push(permission);
    }

    /**
     * Unregisters a permission for the command handler.
     * @param permission The permission to unregister.
     */
    public unregisterPermission(permission: Permission) {
        this.permissions.splice(this.permissions.indexOf(permission), 1);
    }

    /**
     * Registers a phrase to the command handler.
     * @param phrase The phrase to register.
     */
    public registerPhrase(phrase: Phrase) {
        this.commandPhrases.push(phrase);
    }

    /**
     * Unregisters a phrase for the command handler.
     * @param phrase The phrase to unregister.
     */
    public unregisterPhrase(phrase: Phrase) {
        this.commandPhrases.splice(this.commandPhrases.indexOf(phrase), 1);
    }

    /**
     * Registers the command handler's config entries to the bot's config handler.
     */
    public registerConfig() {
        this.bot.config.registerEntry(this.configEntry);
    }

    /**
     * Registers the command handler's permissions to the bot's permission handler.
     */
    public registerPermissions() {
        this.permission = new PermissionGroup({
            description: "Permissions for command execution",
            name: "commands",
        }, this.permissions);
        this.bot.permissions.registerPermission(this.permission);
        this.bot.permissions.everyonePrivilege.allowPermissions(this.permission);
    }

    /**
     * Registers the command handler's phrases to the bot's language handler.
     */
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
        this.bot.languages.registerPhrase(this.phraseGroup);
    }

    /**
     * Registers the command handler's database entities to the bot's database handler.
     */
    public registerDatabase() {
        this.bot.database.registerEntity(GuildAliasEntity);
    }

    /**
     * Loads and registers the builtin commands to the command handler.
     */
    public async registerCommands() {
        const commands = await readdir(resolve(__dirname, "builtin"));
        for (const filename of commands) {
            const path = resolve(__dirname, "builtin", filename);
            // Skip files that aren't javascript
            if (!path.endsWith(".js")) { continue; }
            let required = require(path);
            if (typeof(required) === "function") {
                required = required(this.bot);
            }
            for (const value of Object.values(required)) {
                if (value instanceof Command) {
                    Logger.debug(`Found builtin command ${value.name} in file ${filename}`);
                    this.registerCommand(value);
                    this.registerPhrase(value.phraseGroup);
                }
            }
        }
    }

    /** Reloads the command handler */
    public reload() {
        this.languageCommandsMap.clear();
        this.guildCommandsMap.clear();
    }

    /** Gets the current status string of the command handler. */
    public getStatus() {
        return `${this.commands.size} commands loaded: ${Array.from(this.commands.keys()).join(", ")}`;
    }

    private ensureRepo(): asserts this is this & { repos: NonNullable<Commands["repos"]> } {
        if (!this.repos) {
            this.bot.database.ensureConnection();
            this.repos = {
                alias: this.bot.database.connection.getRepository(GuildAliasEntity),
                member: this.bot.database.repos.member,
            };
        }
    }
}

/**
 * An object providing context to command execution, such as the original message, a response function and so on.
 * @category Command
 */
export interface ICommandContext {
    /** The bot that handles the command. */
    bot: Bot;
    /** The command prefix used for the command. */
    prefix: string;
    /** The original message that triggered the command. */
    message: IExtendedMessage;
    /** The original command that was called. */
    command: string;
    /** The raw string that contains the arguments for the command. */
    passed: string;
    /** The language for the command. */
    language: string;
    /** The function to respond to the command with. */
    respond: LinkedResponse;
    /** Bot permissions that are required for the command. */
    botPermissions: Readonly<DiscordPermissions>;
}

/**
 * A function that responds to the command with the specified message.
 * @category Command
 */
export type LinkedResponse =
    <
        T extends Record<string, string>,
        U extends Record<string, string>,
        V extends Record<string, string>
    >
    (
        phrase: MessagePhrase<T> | DynamicFieldMessagePhrase<T, U>,
        stuff: TemplateStuff<T, V>, fieldStuff?: TemplateStuffs<U, V>,
    ) => Promise<void>;
