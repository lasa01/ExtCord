import { EventEmitter } from "events";
import { ensureDir, readdir, readFile, writeFile } from "fs-extra";
import { resolve } from "path";

import { Config } from "../config/Config";
import { ConfigEntryGroup } from "../config/entry/ConfigEntryGroup";
import { BooleanGuildConfigEntry } from "../config/entry/guild/BooleanGuildConfigEntry";
import { StringGuildConfigEntry } from "../config/entry/guild/StringGuildConfigEntry";
import { StringConfigEntry } from "../config/entry/StringConfigEntry";
import { Database } from "../database/Database";
import { Logger } from "../util/Logger";
import { Serializer } from "../util/Serializer";
import { IExtendedGuild } from "../util/Types";
import { Phrase } from "./phrase/Phrase";

/**
 * The default language of the bot.
 * @category Language
 */
export const DEFAULT_LANGUAGE = "en";

// Event definitions
// tslint:disable-next-line:interface-name
export interface Languages {
    /** @event */
    addListener(event: "loaded", listener: () => void): this;
    /** @event */
    emit(event: "loaded"): boolean;
    /** @event */
    on(event: "loaded", listener: () => void): this;
    /** @event */
    once(event: "loaded", listener: () => void): this;
    /** @event */
    prependListener(event: "loaded", listener: () => void): this;
    /** @event */
    prependOnceListener(event: "loaded", listener: () => void): this;
}

/**
 * The bot's handler for language registering and loading.
 * @category Language
 */
export class Languages extends EventEmitter {
    /** Array of available languages. */
    public languages: string[];
    /** Map of language names. The key is the language (e.g. en), value is the name (e.g. English)). */
    public languageNames: Record<string, string>;
    /** Guild-configurable config entry for the language to use. */
    public languageConfigEntry: StringGuildConfigEntry;
    /** Guild-configurable config entry for whether to use embeds in message. */
    public useEmbedsConfigEntry: BooleanGuildConfigEntry;
    /** Guild-configurable config entry for whether to mention the recipient when replying to messages. */
    public useMentionsConfigEntry: BooleanGuildConfigEntry;
    /** Config entry for the name of the default language. */
    public languageNameConfigEntry: StringConfigEntry;
    /** Config entry for the directory to store language files in. */
    public languageDirConfigEntry: StringConfigEntry;
    private phrases: Map<string, Phrase>;
    private configEntry: ConfigEntryGroup;
    private defaultLoaded: boolean;

    /**
     * Creates a language handler.
     * @param database The database for storing guild-specific data.
     */
    constructor(database: Database) {
        super();
        this.languages = [];
        this.languageNames = {};
        this.phrases = new Map();
        this.defaultLoaded = false;
        this.languageNameConfigEntry = new StringConfigEntry({
            description: "The name of the default language",
            name: "languageName",
        }, "English");
        this.languageDirConfigEntry = new StringConfigEntry({
            description: "The directory for language files",
            name: "languagesDirectory",
        }, "languages");
        this.languageConfigEntry = new StringGuildConfigEntry({
            description: "The default language ISO 639-1 code",
            name: "language",
        }, database, DEFAULT_LANGUAGE);
        this.useEmbedsConfigEntry = new BooleanGuildConfigEntry({
            description: "Use embeds when sending messages",
            name: "useEmbeds",
        }, database, true);
        this.useMentionsConfigEntry = new BooleanGuildConfigEntry({
            description: "Mention the author when replying to messages",
            name: "useMentions",
        }, database, false);
        this.configEntry = new ConfigEntryGroup({
            description: "Languages configuration",
            name: "languages",
        }, [this.languageConfigEntry, this.useEmbedsConfigEntry,
            this.useMentionsConfigEntry, this.languageDirConfigEntry]);
    }

    /**
     * Registers a phrase to the language handler.
     * @param phrase The phrase to register.
     */
    public registerPhrase(phrase: Phrase) {
        this.phrases.set(phrase.name, phrase);
    }

    /**
     * Unregisters a phrase from the language handler.
     * @param phrase The phrase to unregister.
     */
    public unregisterPhrase(phrase: Phrase) {
        this.phrases.delete(phrase.name);
    }

    /**
     * Loads all language files, updates them if necessary and writes the default language file if it doesn't exist.
     * @param directory Overrides the directory to load languages from.
     */
    public async loadAll(directory?: string) {
        directory = directory ?? this.languageDirConfigEntry.get();
        Logger.verbose("Loading all languages");
        await ensureDir(directory);
        // Filter out wrong extensions
        const dirContent = (await readdir(directory)).filter((file) => file.endsWith(Serializer.extension));
        // If no languages exist, write a default language file
        if (dirContent.length === 0) {
            await this.writeLoadDefault(directory);
        }
        for (const filename of dirContent) {
            const path = resolve(directory, filename);
            await this.loadFile(path);
        }
        if (!this.defaultLoaded) {
            await this.writeLoadDefault(directory);
        }
        this.emit("loaded");
    }

    /** Reloads the language manager */
    public async reload() {
        await this.loadAll();
    }

    /**
     * Writes and loads the default language file.
     * @param directory Overrides the directory to write the language to.
     */
    public async writeLoadDefault(directory: string) {
        Logger.verbose("Writing default language file");
        let content = Serializer.stringify({
            id: this.languageConfigEntry.get(),
            name: this.languageNameConfigEntry.get(),
        });
        content = await this.loadText(content);
        await writeFile(resolve(directory, this.languageConfigEntry.get() + Serializer.extension), content);
    }

    /**
     * Loads a single language file, and updates the file if necessary.
     * @param path The path to the language file.
     */
    public async loadFile(path: string) {
        let content;
        try {
            content = await readFile(path, "utf8");
        } catch (err) {
            Logger.error(`An error occured while reading language ${path}: ${err}`);
            return;
        }
        const newContent = await this.loadText(content);
        if (newContent !== content) {
            await writeFile(path, newContent);
        }
    }

    /**
     * Loads a single language from a string. It is parsed with [[Serializer]].
     * @param content The string to load the language from.
     * @returns The updated content of the language, with missing phrases added.
     */
    public async loadText(content: string) {
        let parsed: { [key: string]: any };
        try {
            parsed = Serializer.parse(content);
        } catch {
            Logger.error("An error occured while loading a language");
            return content;
        }
        const id: string = parsed.id;
        const name: string = parsed.name;
        if (!name || !id) {
            Logger.error("A language is missing required information");
            return content;
        }
        if (id === DEFAULT_LANGUAGE) {
            this.defaultLoaded = true;
        }
        if (!this.languages.includes(id)) {
            this.languages.push(id);
            this.languageNames[id] = name;
        }
        for (const [, phrase] of this.phrases) {
            const [data, comment] = phrase.parse(id, parsed[phrase.name]);
            parsed[phrase.name] = data;
            if (comment) {
                Serializer.setComment(parsed, phrase.name, comment);
            }
        }
        return Serializer.stringify(parsed);
    }

    /**
     * Registers the language handler's config entries.
     * @param config The config handler to register entries to.
     */
    public registerConfig(config: Config) {
        config.registerEntry(this.configEntry);
    }

    /**
     * Gets the language of the specified guild.
     * @param guild The guild to use.
     */
    public async getLanguage(guild: IExtendedGuild) {
        if (this.languageConfigEntry) {
            const language = await this.languageConfigEntry.guildGet(guild);
            if (this.languages.includes(language)) {
                return language;
            } else {
                Logger.warn(`Guild ${guild.guild.id} has an invalid language, resetting`);
                await this.languageConfigEntry.guildSet(guild, DEFAULT_LANGUAGE);
                return DEFAULT_LANGUAGE;
            }
        } else {
            return DEFAULT_LANGUAGE;
        }
    }

    /** Gets the current status string of the language handler. */
    public getStatus() {
        return `${this.phrases.size} phrases loaded: ${Array.from(this.phrases.keys()).join(", ")}`;
    }
}
