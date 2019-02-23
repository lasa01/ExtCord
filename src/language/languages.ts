import { resolve } from "path";
import { Logger } from "winston";

import { Config } from "../config/config";
import { ConfigEntryGroup } from "../config/entry/entrygroup";
import { StringGuildConfigEntry } from "../config/entry/guild/stringguildentry";
import { StringConfigEntry } from "../config/entry/stringentry";
import { Database } from "../database/database";
import { mkdir, readdir, readFile, writeFile } from "../util/asyncfs";
import { extension, parse, stringify } from "../util/serializer";
import { Language } from "./language";
import { Phrase } from "./phrase/phrase";

export class Languages {
    public languageConfigEntry?: StringGuildConfigEntry;
    public languageNameConfigEntry?: StringConfigEntry;
    public languageDirConfigEntry?: StringConfigEntry;
    private logger: Logger;
    private languages: Map<string, Language>;
    private phrases: Map<string, Phrase>;
    private configEntry?: ConfigEntryGroup;

    constructor(logger: Logger) {
        this.logger = logger;
        this.languages = new Map();
        this.phrases = new Map();
    }

    public register(phrase: Phrase) {
        this.phrases.set(phrase.name, phrase);
    }

    public async loadAll(directory?: string) {
        directory = directory || this.languageDirConfigEntry!.get();
        this.logger.info("Loading all languages");
        // Ensure directory exists
        try {
            await mkdir(directory);
        } catch (err) {
            if (err.code !== "EEXIST") {
                throw err;
            }
        }
        // Filter out wrong extensions
        const dirContent = (await readdir(directory)).filter((file) => file.endsWith(extension));
        // If no languages exist, write a default language file
        if (dirContent.length === 0) {
            let content = stringify({
                id: this.languageConfigEntry!.get(),
                name: this.languageNameConfigEntry!.get(),
            });
            content = await this.loadText(content);
            await writeFile(resolve(directory, this.languageConfigEntry!.get() + extension), content);
        }
        for (const filename of dirContent) {
            const path = resolve(this.languageDirConfigEntry!.get(), filename);
            await this.loadFile(path);
        }
    }

    public async loadFile(path: string) {
        let content;
        try {
            content = await readFile(path, "utf8");
        } catch (err) {
            this.logger.error(`An error occured while reading language ${path}: ${err}`);
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
            parsed = parse(content);
        } catch {
            this.logger.error("An error occured while loading a language");
            return content;
        }
        const id: string = parsed.id;
        const name: string = parsed.name;
        if (!name || !id) {
            this.logger.error("A language file is missing required information");
            return content;
        }
        for (const [, phrase] of this.phrases) {
            const [data, comment] = phrase.parse(id, parsed[phrase.name]);
            parsed[phrase.name] = data;
            if (!parsed[phrase.name + "__commentBefore__"] && comment) {
                Object.defineProperty(parsed, phrase.name + "__commentBefore__", { enumerable: false, writable: true});
                parsed[phrase.name + "__commentBefore__"] = comment;
            }
        }
        return stringify(parsed);
    }

    public registerConfig(config: Config, database: Database) {
        this.languageConfigEntry = new StringGuildConfigEntry({
            description: "The default language ISO 639-1 code",
            name: "language",
        }, database, "en");
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
        }, [ this.languageConfigEntry, this.languageDirConfigEntry ]);
        config.register(this.configEntry);
    }

    public getStatus() {
        return `${this.phrases.size} phrases loaded: ${Array.from(this.phrases.keys()).join(", ")}`;
    }
}
