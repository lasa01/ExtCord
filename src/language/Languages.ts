import { Guild } from "discord.js";
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
import { Phrase } from "./phrase/Phrase";
import { ISimpleMap } from "./phrase/SimplePhrase";

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

export class Languages extends EventEmitter {
    public languages: string[];
    public languageNames: ISimpleMap;
    public languageConfigEntry?: StringGuildConfigEntry;
    public useEmbedsConfigEntry?: BooleanGuildConfigEntry;
    public useMentionsConfigEntry?: BooleanGuildConfigEntry;
    public languageNameConfigEntry?: StringConfigEntry;
    public languageDirConfigEntry?: StringConfigEntry;
    private phrases: Map<string, Phrase>;
    private configEntry?: ConfigEntryGroup;
    private defaultLoaded: boolean;

    constructor() {
        super();
        this.languages = [];
        this.languageNames = {};
        this.phrases = new Map();
        this.defaultLoaded = false;
    }

    public registerPhrase(phrase: Phrase) {
        this.phrases.set(phrase.name, phrase);
    }

    public unregisterPhrase(phrase: Phrase) {
        this.phrases.delete(phrase.name);
    }

    public async loadAll(directory?: string) {
        directory = directory || this.languageDirConfigEntry!.get();
        Logger.verbose("Loading all languages");
        await ensureDir(directory);
        // Filter out wrong extensions
        const dirContent = (await readdir(directory)).filter((file) => file.endsWith(Serializer.extension));
        // If no languages exist, write a default language file
        if (dirContent.length === 0) {
            await this.writeLoadDefault(directory);
        }
        for (const filename of dirContent) {
            const path = resolve(this.languageDirConfigEntry!.get(), filename);
            await this.loadFile(path);
        }
        if (!this.defaultLoaded) {
            await this.writeLoadDefault(directory);
        }
        this.emit("loaded");
    }

    public async writeLoadDefault(directory: string) {
        Logger.verbose("Writing default language file");
        let content = Serializer.stringify({
            id: this.languageConfigEntry!.get(),
            name: this.languageNameConfigEntry!.get(),
        });
        content = await this.loadText(content);
        await writeFile(resolve(directory, this.languageConfigEntry!.get() + Serializer.extension), content);
    }

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
            if (!parsed[phrase.name + "__comment__"] && comment) {
                Object.defineProperty(parsed, phrase.name + "__comment__", { enumerable: false, writable: true});
                parsed[phrase.name + "__comment__"] = comment;
            }
        }
        return Serializer.stringify(parsed);
    }

    public registerConfig(config: Config, database: Database) {
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
        this.languageNameConfigEntry = new StringConfigEntry({
            description: "The name of the default language",
            name: "languageName",
        }, "English");
        this.languageDirConfigEntry = new StringConfigEntry({
            description: "The directory for language files",
            name: "languagesDirectory",
        }, "languages");
        this.configEntry = new ConfigEntryGroup({
            description: "Languages configuration",
            name: "languages",
        }, [this.languageConfigEntry, this.useEmbedsConfigEntry,
            this.useMentionsConfigEntry, this.languageDirConfigEntry]);
        config.registerEntry(this.configEntry);
    }

    public async getLanguage(guild: Guild) {
        if (this.languageConfigEntry) {
            const language = await this.languageConfigEntry.guildGet(guild);
            if (this.languages.includes(language)) {
                return language;
            } else {
                Logger.warn(`Guild ${guild.id} has an invalid language, resetting`);
                await this.languageConfigEntry.guildSet(guild, DEFAULT_LANGUAGE);
                return DEFAULT_LANGUAGE;
            }
        } else {
            return DEFAULT_LANGUAGE;
        }
    }

    public getStatus() {
        return `${this.phrases.size} phrases loaded: ${Array.from(this.phrases.keys()).join(", ")}`;
    }
}
