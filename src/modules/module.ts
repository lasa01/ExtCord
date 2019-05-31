import { Bot } from "../bot";
import { Command } from "../commands/command";
import { ConfigEntry } from "../config/entry/entry";
import { Phrase } from "../language/phrase/phrase";
import { Permission } from "../permissions/permission";

export abstract class Module {
    public author: string;
    public name: string;
    protected bot: Bot;
    protected configEntries: ConfigEntry[];
    protected commands: Command[];
    protected permissions: Permission[];
    protected phrases: Phrase[];

    public constructor(bot: Bot, author: string, name: string) {
        this.author = author;
        this.name = name;
        this.bot = bot;
        this.configEntries = [];
        this.commands = [];
        this.permissions = [];
        this.phrases = [];
    }

    public rename() {
        this.name = this.author + "-" + this.name;
    }

    public async unload() {
        for (const command of this.commands) {
            this.unregisterCommand(command);
        }
        for (const permission of this.permissions) {
            this.unregisterPermission(permission);
        }
    }

    protected registerConfigEntry(entry: ConfigEntry) {
        this.bot.config.register(entry);
        this.configEntries.push(entry);
    }

    protected unregisterConfigEntry(entry: ConfigEntry) {
        this.bot.config.unregister(entry);
        this.configEntries.splice(this.configEntries.indexOf(entry), 1);
    }

    protected registerCommand(command: Command) {
        this.bot.commands.register(command);
        this.commands.push(command);
    }

    protected unregisterCommand(command: Command) {
        this.bot.commands.unregister(command);
        this.commands.splice(this.commands.indexOf(command), 1);
    }

    protected registerPermission(permission: Permission) {
        this.bot.permissions.register(permission);
        this.permissions.push(permission);
    }

    protected unregisterPermission(permission: Permission) {
        this.bot.permissions.unregister(permission);
        this.permissions.splice(this.permissions.indexOf(permission), 1);
    }

    protected registerPhrase(phrase: Phrase) {
        this.bot.languages.register(phrase);
        this.phrases.push(phrase);
    }

    protected unregisterPhrase(phrase: Phrase) {
        this.bot.languages.unregister(phrase);
        this.phrases.splice(this.phrases.indexOf(phrase), 1);
    }
}
