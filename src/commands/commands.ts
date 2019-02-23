import { Message } from "discord.js";
import { Logger } from "winston";

import { Config } from "../config/config";
import { ConfigEntryGroup } from "../config/entry/entrygroup";
import { StringGuildConfigEntry } from "../config/entry/guild/stringguildentry";
import { Database } from "../database/database";
import { Languages } from "../language/languages";
import { Phrase } from "../language/phrase/phrase";
import { PhraseGroup } from "../language/phrase/phrasegroup";
import { Permission } from "../permissions/permission";
import { PermissionGroup } from "../permissions/permissiongroup";
import { Permissions } from "../permissions/permissions";
import { Command } from "./command";

export class Commands {
    public prefixConfigEntry?: StringGuildConfigEntry;
    private logger: Logger;
    private commands: Map<string, Command>;
    private configEntry?: ConfigEntryGroup;
    private permissionTemplate: Map<string, Permission>;
    private permission?: Permission;
    private phrases: Phrase[];
    private phraseGroup?: PhraseGroup;

    constructor(logger: Logger) {
        this.logger = logger;
        this.commands = new Map();
        this.permissionTemplate = new Map();
        this.phrases = [];
    }

    public async message(message: Message) {
        if (!message.guild) { return; } // For now
        const prefix = await this.prefixConfigEntry!.guildGet(message.guild);
        if (!message.content.startsWith(prefix)) { return; }
        const text = message.content.replace(prefix, "").trim();
        const command = text.split(" ", 1)[0];
        if (!command || !this.commands.has(command)) { return; } // For now
        const commandInstance = this.commands.get(command)!;
        const passed = text.replace(command, "").trim();
        const context = {
            command,
            message,
            passed,
            prefix,
        };
        this.logger.debug(`Executing command ${command}`);
        try {
            await commandInstance.command(context);
        } catch (err) {
            this.logger.error(`Error while executing command ${command}: ${err}`);
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
        this.permissionTemplate.set(command.name, command.getPermission());
    }

    public registerPhrase(phrase: Phrase) {
        this.phrases.push(phrase);
    }

    public registerConfig(config: Config, database: Database) {
        this.prefixConfigEntry = new StringGuildConfigEntry({
            description: "The prefix for commands",
            name: "prefix",
        }, database, "!");
        this.configEntry = new ConfigEntryGroup({
            description: "Commands configuration",
            name: "commands",
        }, [ this.prefixConfigEntry ]);
        config.register(this.configEntry);
    }

    public registerPermissions(permissions: Permissions) {
        this.permission = new PermissionGroup({
            description: "Command permissions",
            name: "commands",
        }, Array.from(this.permissionTemplate.values()));
        permissions.register(this.permission);
    }

    public registerLanguages(languages: Languages) {
        this.phraseGroup = new PhraseGroup({
            description: "Language definitions for commands",
            name: "commands",
        }, this.phrases);
        languages.register(this.phraseGroup);
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
}
