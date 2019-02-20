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
import Phrase from "./phrase/phrase";

export default class Languages {
    public languageConfigEntry?: StringGuildConfigEntry;
    public languageNameConfigEntry?: StringConfigEntry;
    public dirConfigEntry?: StringConfigEntry;
    private logger: Winston.Logger;
    private languages: Map<string, Language>;
    private phrases: Map<string, Phrase>;
    private configEntry?: ConfigEntryGroup;

    constructor(logger: Winston.Logger) {
        this.logger = logger;
        this.languages = new Map();
        this.phrases = new Map();
    }

    public async loadAll(directory: string) {
        this.logger.info("Loading all languages");
        const dirContent = await AsyncFS.readdir(directory);
        // If no languages exist, write a default language file
        if (dirContent.length === 0) {
            const file = Serializer.stringify({
                id: this.languageConfigEntry!.get(),
                name: this.languageNameConfigEntry!.get(),
            });
        }
        for (const fileName of dirContent) {
            if (!fileName.endsWith(Serializer.extension)) { continue; }
            const path = Path.resolve(process.cwd(), this.dirConfigEntry!.get(), fileName);
            let content;
            try {
                content = await AsyncFS.readFile(path, "utf8");
            } catch (err) {
                this.logger.error(`An error occured while reading language ${path}: ${err}`);
                return;
            }
            const newContent = await this.load(content);
            if (newContent !== content) {
                await AsyncFS.writeFile(path, newContent);
            }
        }
    }

    public async load(content: string) {
        let parsed: any;
        try {
            parsed = Serializer.parse(content);
        } catch {
            this.logger.error("An error occured while loading a language");
            return;
        }
        const id: string = parsed.id;
        const name: string = parsed.name;
        if (!name || !id) {
            this.logger.error("A language file is missing required information");
            return;
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
        this.dirConfigEntry = new StringConfigEntry({
            description: "The directory for language files",
            name: "languagesDirectory",
        }, "languages");
        this.configEntry = new ConfigEntryGroup({
            description: "Languages configuration",
            name: "languages",
        }, [ this.languageConfigEntry, this.dirConfigEntry ]);
        config.register(this.configEntry);
    }
}
