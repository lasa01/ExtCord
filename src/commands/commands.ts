import { Message } from "discord.js";
import { Logger } from "winston";

import { Config } from "../config/config";
import { ConfigEntryGroup } from "../config/entry/entrygroup";
import { StringGuildConfigEntry } from "../config/entry/guild/stringguildentry";
import { Database } from "../database/database";
import { Languages } from "../language/languages";
import { Phrase } from "../language/phrase/phrase";
import { PhraseGroup } from "../language/phrase/phrasegroup";
import { TemplatePhrase } from "../language/phrase/templatephrase";
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
    private commandPhrases: Phrase[];
    private commandPhraseGroup?: PhraseGroup;
    private phrases: {
        executionError: TemplatePhrase<{ error: string}>;
        invalidArgument: TemplatePhrase<{ argument: string }>;
        invalidCommand: TemplatePhrase<{ command: string }>;
        noPermission: TemplatePhrase<{ command: string }>;
        tooFewArguments: TemplatePhrase<{ supplied: string, required: string }>;
        tooManyArguments: TemplatePhrase<{ supplied: string, required: string }>;
        [key: string]: TemplatePhrase<any>;
    };
    private phraseGroup?: PhraseGroup;

    constructor(logger: Logger) {
        this.logger = logger;
        this.commands = new Map();
        this.permissionTemplate = new Map();
        this.commandPhrases = [];
        this.phrases = {
            executionError: new TemplatePhrase({
                name: "executionError",
            }, "Execution failed: {error}", {
                error: "The error that occured",
            }),
            invalidArgument: new TemplatePhrase({
                name: "invalidArgument",
            }, "Argument \"{argument}\" is invalid", {
                argument: "The invalid argument",
            }),
            invalidCommand: new TemplatePhrase({
                name: "invalidCommand",
            }, "Command {command} not found", {
                command: "The called command",
            }),
            noPermission: new TemplatePhrase({
                name: "noPermission",
            }, "You lack permissions to execute the command \"{command}\"", {
                command: "The called command",
            }),
            tooFewArguments: new TemplatePhrase({
                name: "tooFewArguments",
            }, "Too few arguments supplied: {supplied} supplied, {required} required", {
                required: "The amount of required arguments",
                supplied: "The amount of supplied arguments",
            }),
            tooManyArguments: new TemplatePhrase({
                name: "tooManyArguments",
            }, "Too many arguments supplied: {supplied} supplied, {required} required", {
                required: "The amount of required arguments",
                supplied: "The amount of supplied arguments",
            }),
        };
    }

    public async message(message: Message) {
        if (!message.guild) { return; } // For now
        const prefix = await this.prefixConfigEntry!.guildGet(message.guild);
        if (!message.content.startsWith(prefix)) { return; }
        const text = message.content.replace(prefix, "").trim();
        const command = text.split(" ", 1)[0];
        if (!command || !this.commands.has(command)) {
            await message.reply(this.phrases.invalidCommand.format("en", { command }));
            return;
        }
        const commandInstance = this.commands.get(command)!;
        const passed = text.replace(command, "").trim();
        const context = {
            command,
            message,
            passed,
            prefix,
        };
        this.logger.debug(`Executing command ${command}`);
        const err = await commandInstance.command(context);
        if (err) {
            const errPhrase = this.phrases[err[0]];
            await message.reply(errPhrase.format("en", err[1]));
            return;
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
        this.commandPhrases.push(phrase);
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
        }, Array.from(this.permissionTemplate.values()));
        permissions.register(this.permission);
    }

    public registerLanguages(languages: Languages) {
        this.commandPhraseGroup = new PhraseGroup({
            description: "Language definitions for individual commands",
            name: "commands",
        }, this.commandPhrases);
        this.phraseGroup = new PhraseGroup({
            name: "commands",
        }, [ ...Object.values(this.phrases), this.commandPhraseGroup ]);
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
