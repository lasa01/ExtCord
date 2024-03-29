import { Bot } from "../Bot";
import { AnyCommand, Command } from "../commands/Command";
import { ConfigEntry } from "../config/entry/ConfigEntry";
import { ConfigEntryGroup } from "../config/entry/ConfigEntryGroup";
import { Phrase } from "../language/phrase/Phrase";
import { PhraseGroup } from "../language/phrase/PhraseGroup";
import { Permission } from "../permissions/Permission";
import { PermissionGroup } from "../permissions/PermissionGroup";

/**
 * A generic abstract class for all modules.
 * @category Module
 */
export abstract class Module {
    /** The name of the author of the module. */
    public author: string;
    /** The name of the module. */
    public name: string;
    protected bot: Bot;
    protected configEntries: ConfigEntry[];
    protected commands: AnyCommand[];
    protected permissions: Permission[];
    protected phrases: Phrase[];
    private configEntryGroup: ConfigEntryGroup;
    private permissionGroup: PermissionGroup;
    private phraseGroup: PhraseGroup;
    private commandsPhraseGroup: PhraseGroup;
    private permissionsPhraseGroup: PhraseGroup;

    /**
     * Creates a new module.
     * @param bot Defines the bot the module is loaded to.
     * @param author Defines the author of the module.
     * @param name Defines the name of the module.
     */
    public constructor(bot: Bot, author: string, name: string) {
        this.author = author;
        this.name = name;
        this.bot = bot;
        this.configEntries = [];
        this.commands = [];
        this.permissions = [];
        this.phrases = [];
        this.configEntryGroup = new ConfigEntryGroup({ name });
        this.permissionGroup = new PermissionGroup({ name });
        this.commandsPhraseGroup = new PhraseGroup({ name: "commands" });
        this.permissionsPhraseGroup = new PhraseGroup({ name: "permissions" });
        this.phraseGroup = new PhraseGroup({ name });
    }

    /** Try to rename the module in case of a naming conflict. */
    public rename() {
        this.name = this.author + "-" + this.name;
    }

    /** Load the module. */
    public load() {
        if (this.configEntryGroup.entries.size !== 0) {
            this.bot.config.registerEntry(this.configEntryGroup);
        }
        if (this.permissionGroup.children.size !== 0) {
            this.bot.permissions.registerPermission(this.permissionGroup);
        }
        if (this.commandsPhraseGroup.phrases.size !== 0) {
            this.phraseGroup.addPhrases(this.commandsPhraseGroup);
        }
        if (this.permissionsPhraseGroup.phrases.size !== 0) {
            this.phraseGroup.addPhrases(this.permissionsPhraseGroup);
        }
        if (this.phraseGroup.phrases.size !== 0) {
            this.bot.languages.registerPhrase(this.phraseGroup);
        }
    }

    /** Unload the module. */
    public async unload() {
        for (const phrase of this.phrases) {
            this.unregisterPhrase(phrase);
        }
        for (const command of this.commands) {
            this.unregisterCommand(command);
        }
        for (const permission of this.permissions) {
            this.unregisterPermission(permission);
        }
        for (const phrase of this.phrases) {
            this.unregisterPhrase(phrase);
        }
        this.bot.config.unregisterEntry(this.configEntryGroup);
        this.bot.permissions.unregisterPermission(this.permissionGroup);
        this.bot.languages.unregisterPhrase(this.phraseGroup);
    }

    protected registerConfigEntry(entry: ConfigEntry) {
        this.configEntryGroup.addEntries(entry);
        this.configEntries.push(entry);
    }

    protected unregisterConfigEntry(entry: ConfigEntry) {
        this.configEntryGroup.addEntries(entry);
        this.configEntries.splice(this.configEntries.indexOf(entry), 1);
    }

    protected registerCommand(command: AnyCommand) {
        this.bot.commands.registerCommand(command);
        this.commandsPhraseGroup.addPhrases(command.phraseGroup);
        this.commands.push(command);
    }

    protected unregisterCommand(command: AnyCommand) {
        this.bot.commands.unregisterCommand(command);
        this.commandsPhraseGroup.removePhrases(command.phraseGroup);
        this.commands.splice(this.commands.indexOf(command), 1);
    }

    protected registerPermission(permission: Permission) {
        this.permissionGroup.addPermissions(permission);
        this.permissionsPhraseGroup.addPhrases(permission.phraseGroup);
        this.permissions.push(permission);
    }

    protected unregisterPermission(permission: Permission) {
        this.permissionGroup.removePermissions(permission);
        this.permissionsPhraseGroup.removePhrases(permission.phraseGroup);
        this.permissions.splice(this.permissions.indexOf(permission), 1);
    }

    protected registerPhrase(phrase: Phrase) {
        this.phraseGroup.addPhrases(phrase);
        this.phrases.push(phrase);
    }

    protected unregisterPhrase(phrase: Phrase) {
        this.phraseGroup.removePhrases(phrase);
        this.phrases.splice(this.phrases.indexOf(phrase), 1);
    }
}
