import Discord from "discord.js";
import Winston from "winston";

import Config from "../config/config";
import ConfigEntryGroup from "../config/entry/entrygroup";
import StringGuildConfigEntry from "../config/entry/guild/stringguildentry";
import Database from "../database/database";
import Permission from "../permissions/permission";
import PermissionGroup from "../permissions/permissiongroup";
import Permissions from "../permissions/permissions";
import Argument from "./arguments/argument";
import Command from "./command";

export default class Commands {
    public prefixConfigEntry?: StringGuildConfigEntry;
    private logger: Winston.Logger;
    private commands: Map<string, Command>;
    private configEntry?: ConfigEntryGroup;
    private permissionTemplate: Map<string, Permission>;
    private permission?: Permission;

    constructor(logger: Winston.Logger) {
        this.logger = logger;
        this.commands = new Map();
        this.permissionTemplate = new Map();
    }

    public async message(message: Discord.Message) {
        if (!message.guild) { return; } // For now
        const prefix = await this.prefixConfigEntry!.guildGet(message.guild);
        if (!message.content.startsWith(prefix)) { return; }
        const text = message.content.replace(prefix, "").trim();
        const command = text.split(" ", 1)[0];
        if (!command || !this.commands.has(command)) { return; } // For now
        const commandInstance = this.commands.get(command)!;
        const passed = text.replace(command, "").trim();
        const rawArguments = passed.split(" ");
        const parsed: any[] = [];
        if (rawArguments.length < commandInstance.arguments.length) { return; } // For now
        for (const argument of commandInstance.arguments) {
            const rawArgument = rawArguments.shift()!;
            if (!argument.check(rawArgument)) {
                continue; // For now
            }
            parsed.push(argument.parse(rawArgument));
        }
        const context = {
            arguments: parsed,
            command,
            message,
            prefix,
            rawArguments,
        };
        this.logger.debug(`Executing command ${command}`);
        try {
            await this.commands.get(command)!.command(context);
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
        this.commands.set(command.name, command);
        this.permissionTemplate.set(command.name, command.getPermission());
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

    public getStatus() {
        return `${this.commands.size} commands loaded: ${Array.from(this.commands.keys()).join(", ")}`;
    }
}
