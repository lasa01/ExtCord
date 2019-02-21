import Path from "path";
import Winston from "winston";

import Config from "../config/config";
import ConfigEntryGroup from "../config/entry/entrygroup";
import StringGuildConfigEntry from "../config/entry/guild/stringguildentry";
import StringConfigEntry from "../config/entry/stringentry";
import Database from "../database/database";
import AsyncFS from "../util/asyncfs";
import Serializer from "../util/serializer";
import Language from "./language";
import BasePhrase from "./phrase/basephrase";

export default class Languages {
    public languageConfigEntry?: StringGuildConfigEntry;
    public languageNameConfigEntry?: StringConfigEntry;
    public languageDirConfigEntry?: StringConfigEntry;
    private logger: Winston.Logger;
    private languages: Map<string, Language>;
    private phrases: Map<string, BasePhrase>;
    private configEntry?: ConfigEntryGroup;

    constructor(logger: Winston.Logger) {
        this.logger = logger;
        this.languages = new Map();
        this.phrases = new Map();
    }

    public register(phrase: BasePhrase) {
        this.phrases.set(phrase.name, phrase);
    }

    public async loadAll(directory?: string) {
        directory = directory || this.languageDirConfigEntry!.get();
        this.logger.info("Loading all languages");
        const dirContent = await AsyncFS.readdir(Path.resolve(process.cwd(), directory));
        // If no languages exist, write a default language file
        if (dirContent.length === 0) {
            let content = Serializer.stringify({
                id: this.languageConfigEntry!.get(),
                name: this.languageNameConfigEntry!.get(),
            });
            content = await this.loadText(content);
            await AsyncFS.writeFile(Path.resolve(process.cwd(), directory, this.languageConfigEntry!.get()), content);
        }
        for (const filename of dirContent) {
            const path = Path.resolve(process.cwd(), this.languageDirConfigEntry!.get(), filename);
            await this.loadFile(path);
        }
    }

    public async loadFile(path: string) {
        if (!path.endsWith(Serializer.extension)) { return; }
        let content;
        try {
            content = await AsyncFS.readFile(path, "utf8");
        } catch (err) {
            this.logger.error(`An error occured while reading language ${path}: ${err}`);
            return;
        }
        const newContent = await this.loadText(content);
        if (newContent !== content) {
            await AsyncFS.writeFile(path, newContent);
        }
    }

    public async loadText(content: string) {
        let parsed: any;
        try {
            parsed = Serializer.parse(content);
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
            if (!parsed[phrase.name + "__commentBefore__"]) {
                parsed[phrase.name + "__commentBefore__"] = comment;
            }
        }
        return Serializer.stringify(parsed);
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
}
