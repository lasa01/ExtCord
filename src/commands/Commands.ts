import { Guild, Message } from "discord.js";
import { EventEmitter } from "events";
import { readdir } from "fs-extra";
import { resolve } from "path";

import { Repository } from "typeorm";
import { Bot } from "../Bot";
import { ConfigEntryGroup } from "../config/entry/ConfigEntryGroup";
import { StringGuildConfigEntry } from "../config/entry/guild/StringGuildConfigEntry";
import { DynamicFieldMessagePhrase, TemplateStuffs } from "../language/phrase/DynamicFieldMessagePhrase";
import { MessagePhrase } from "../language/phrase/MessagePhrase";
import { Phrase } from "../language/phrase/Phrase";
import { PhraseGroup } from "../language/phrase/PhraseGroup";
import { ISimpleMap } from "../language/phrase/SimplePhrase";
import { TemplateStuff } from "../language/phrase/TemplatePhrase";
import { Permission } from "../permissions/Permission";
import { PermissionGroup } from "../permissions/PermissionGroup";
import { Logger } from "../util/Logger";
import { ExtendedGuild, ExtendedMessage } from "../util/Types";
import { BuiltInArguments } from "./arguments/BuiltinArguments";
import { Command } from "./Command";
import { CommandPhrases } from "./CommandPhrases";
import { GuildAliasEntity } from "./database/GuildAliasEntity";

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
    public aliasRepo?: Repository<GuildAliasEntity>;
    private bot: Bot;
    private commands: Map<string, Command<any>>;
    private languageCommandsMap: Map<string, Map<string, Command<any>>>;
    private guildCommandsMap: Map<string, Map<string, Command<any>>>;
    private configEntry?: ConfigEntryGroup;
    private permissions: Permission[];
    private permission?: Permission;
    private commandPhrases: Phrase[];
    private commandPhraseGroup?: PhraseGroup;
    private argumentsGroup?: PhraseGroup;
    private phrasesGroup?: PhraseGroup;
    private phraseGroup?: PhraseGroup;

    constructor(bot: Bot) {
        super();
        this.bot = bot;
        this.commands = new Map();
        this.guildCommandsMap = new Map();
        this.languageCommandsMap = new Map();
        this.permissions = [];
        this.commandPhrases = [];
    }

    public async message(discordMessage: Message) {
        const startTime = process.hrtime();
        if (!discordMessage.guild || discordMessage.author.bot) { return; } // For now
        // TODO this somewhere else, will be needed elsewhere
        const author = Object.assign(discordMessage.author, {
            entity: await this.bot.database.repos.user!.getEntity(discordMessage.author),
        });
        const guild = Object.assign(discordMessage.guild, {
            entity: await this.bot.database.repos.guild!.getEntity(discordMessage.guild),
        });
        const message: ExtendedMessage = Object.assign(discordMessage, {
            author,
            guild,
            member: Object.assign(discordMessage.member, {
                entity: await this.bot.database.repos.member!.getEntity(discordMessage.member),
                guild,
                user: author,
            }),
        });
        const prefix = await this.prefixConfigEntry!.guildGet(message.guild);
        // TODO really doesn't need to be reassigned each call
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
        const language = await this.bot.languages.getLanguage(message.guild);
        const useEmbeds = await this.bot.languages.useEmbedsConfigEntry!.guildGet(message.guild);
        const useMentions = await this.bot.languages.useMentionsConfigEntry!.guildGet(message.guild);
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
                    options = undefined;
                }
                if (useMentions) {
                    await message.reply(content, options);
                } else {
                    await message.channel.send(content, options);
                }
            };
        const commandInstance = await this.getCommandInstance(message.guild, language, command);
        if (!commandInstance) {
            await respond(CommandPhrases.invalidCommand, { command });
            return;
        }
        const passed = text.replace(command, "").trim();
        const context = {
            bot: this.bot,
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

    public async getCommandInstance(guild: ExtendedGuild, language: string, command: string) {
        if (!this.guildCommandsMap.has(guild.id)) {
            await this.createGuildCommandsMap(guild, language);
        }
        return this.guildCommandsMap.get(guild.id)!.get(command);
    }

    public async createGuildCommandsMap(guild: ExtendedGuild, language: string) {
        if (!this.languageCommandsMap.has(language)) {
            this.createLanguageCommmandsMap(language);
        }
        const map = new Map(this.languageCommandsMap.get(language)!);
        this.ensureRepo();
        const aliases = await this.aliasRepo.find({
            guild: guild.entity,
        });
        for (const alias of aliases) {
            const command = this.commands.get(alias.command);
            if (!command) {
                Logger.warn(`Alias "${alias.alias}" in guild ${guild.id} refers to invalid command "${alias.command}"`);
                continue;
            }
            map.set(alias.alias, command);
        }
        this.guildCommandsMap.set(guild.id, map);
    }

    public createLanguageCommmandsMap(language: string) {
        const map: Map<string, Command<any>> = new Map();
        for (const [, command] of this.commands) {
            map.set(command.localizedName.get(language), command);
            for (const [alias, aliasCommand] of Object.entries(command.getAliases(language))) {
                map.set(alias, aliasCommand);
            }
        }
        this.languageCommandsMap.set(language, map);
    }

    public async setAlias(guild: ExtendedGuild, language: string, alias: string, command: Command<any>) {
        this.ensureRepo();
        let entity = await this.aliasRepo.findOne({
            alias,
            guild: guild.entity,
        });
        if (!entity) {
            entity = this.aliasRepo.create({
                alias,
                command: command.name,
                guild: guild.entity,
            });
        } else {
            entity.command = command.name;
        }
        await this.aliasRepo.save(entity);
        if (!this.guildCommandsMap.has(guild.id)) {
            await this.createGuildCommandsMap(guild, language);
        } else {
            this.guildCommandsMap.get(guild.id)!.set(alias, command);
        }
    }

    public async removeAlias(guild: ExtendedGuild, language: string, alias: string) {
        this.ensureRepo();
        const entity = await this.aliasRepo.findOne({
            alias,
            guild: guild.entity,
        });
        if (entity) {
            await this.aliasRepo.remove(entity);
        }
        if (!this.guildCommandsMap.has(guild.id)) {
            await this.createGuildCommandsMap(guild, language);
        } else {
            this.guildCommandsMap.get(guild.id)!.delete(alias);
        }
    }

    public registerCommand(command: Command<any>) {
        if (this.commands.has(command.name)) {
            throw new Error(`A command is already registered by the name ${command.name}`);
        }
        this.registerPermission(command.getPermission());
        command.registerSelf(this.bot);
        this.commands.set(command.name, command);
    }

    public unregisterCommand(command: Command<any>) {
        this.unregisterPermission(command.getPermission());
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

    public registerConfig() {
        this.prefixConfigEntry = new StringGuildConfigEntry({
            description: "The prefix for commands",
            name: "prefix",
        }, this.bot.database, "!");
        this.configEntry = new ConfigEntryGroup({
            name: "commands",
        }, [ this.prefixConfigEntry ]);
        this.bot.config.registerEntry(this.configEntry);
    }

    public registerPermissions() {
        this.permission = new PermissionGroup({
            description: "Permissions for command execution",
            name: "commands",
        }, this.permissions);
        this.bot.permissions.registerPermission(this.permission);
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
        this.bot.languages.registerPhrase(this.phraseGroup);
    }

    public registerDatabase() {
        this.bot.database.registerEntity(GuildAliasEntity);
    }

    public async registerCommands() {
        const commands = await readdir(resolve(__dirname, "builtin"));
        for (const filename of commands) {
            const path = resolve(__dirname, "builtin", filename);
            // Skip files that aren't javascript
            if (!path.endsWith(".js")) { continue; }
            const required = require(path);
            for (const value of Object.values(required)) {
                if (value instanceof Command) {
                    Logger.debug(`Found builtin command ${value.name} in file ${filename}`);
                    this.registerCommand(value);
                    this.registerPhrase(value.phraseGroup);
                }
            }
        }
    }

    public getStatus() {
        return `${this.commands.size} commands loaded: ${Array.from(this.commands.keys()).join(", ")}`;
    }

    private ensureRepo(): asserts this is this & { aliasRepo: Repository<GuildAliasEntity> } {
        if (!this.aliasRepo) {
            this.aliasRepo = this.bot.database.connection!.getRepository(GuildAliasEntity);
        }
    }
}

export interface ICommandContext {
    bot: Bot;
    prefix: string;
    message: ExtendedMessage;
    command: string;
    passed: string;
    language: string;
    respond: LinkedResponse;
}

export type LinkedResponse = <T extends ISimpleMap, U extends ISimpleMap, V extends ISimpleMap>(
    phrase: MessagePhrase<T> | DynamicFieldMessagePhrase<T, U>,
    stuff: TemplateStuff<T, V>, fieldStuff?: TemplateStuffs<U, V>,
) => Promise<void>;
