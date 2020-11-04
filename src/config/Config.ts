import { EventEmitter } from "events";
import { readFile, writeFile } from "fs-extra";

import { Database } from "../database/Database";
import { Logger } from "../util/Logger";
import { Serializer } from "../util/Serializer";
import { ConfigEntry } from "./entry/ConfigEntry";
import { BooleanConfigEntity } from "./entry/guild/database/BooleanConfigEntity";
import { NumberConfigEntity } from "./entry/guild/database/NumberConfigEntity";
import { StringConfigEntity } from "./entry/guild/database/StringConfigEntity";

// Event definitions
// tslint:disable-next-line:interface-name
export interface Config {
    /** @event */
    addListener(event: "loaded", listener: (stage: number) => void): this;
    /** @event */
    emit(event: "loaded", stage: number): boolean;
    /** @event */
    on(event: "loaded", listener: (stage: number) => void): this;
    /** @event */
    once(event: "loaded", listener: (stage: number) => void): this;
    /** @event */
    prependListener(event: "loaded", listener: (stage: number) => void): this;
    /** @event */
    prependOnceListener(event: "loaded", listener: (stage: number) => void): this;
}

/**
 * The bot's handler for config registering and loading.
 * @category Config
 */
export class Config extends EventEmitter {
    /**
     * Registers the config handler's database entities to the specified database.
     * @param database The database to use.
     */
    public static registerDatabase(database: Database) {
        database.registerEntity(BooleanConfigEntity);
        database.registerEntity(NumberConfigEntity);
        database.registerEntity(StringConfigEntity);
    }

    private configFile: string;
    private entries: Map<string, ConfigEntry>;
    private stages: Map<number, ConfigEntry[]>;
    private orderedStages?: number[];

    /**
     * Creates a config handler.
     * @param configFile The path of the config file.
     */
    constructor(configFile: string) {
        super();
        this.configFile = configFile;
        this.entries = new Map();
        this.stages = new Map();
    }

    /**
     * Registers a config entry to the config handler.
     * @param entry The entry to register.
     */
    public registerEntry(entry: ConfigEntry) {
        Logger.debug(`Registering config entry ${entry.name}`);
        this.entries.set(entry.name, entry);
        const stage = this.stages.get(entry.loadStage) ?? [];
        stage.push(entry);
        if (!this.stages.has(entry.loadStage)) { this.stages.set(entry.loadStage, stage); }
        entry.updateFullName();
    }

    /**
     * Unregisters a config entry from the config handler.
     * @param entry The entry to unregister.
     */
    public unregisterEntry(entry: ConfigEntry) {
        this.entries.delete(entry.name);
        const stage = this.stages.get(entry.loadStage)!;
        stage.splice(stage.indexOf(entry));
    }

    /**
     * Checks if the config handler still has stages left to load.
     */
    public hasNext() {
        if (!this.orderedStages) {
            return this.stages.size !== 0;
        } else {
            return this.orderedStages.length !== 0;
        }
    }

    /**
     * Loads the next config stage.
     * @param filename Overrides the default config file if specified.
     */
    public async loadNext(filename?: string): Promise<number> {
        filename = filename ?? this.configFile;
        if (!this.orderedStages) {
            this.orderedStages = Array.from(this.stages.keys());
            this.orderedStages.sort((a, b) => a - b);
        }
        const stage = this.orderedStages.shift();
        if (stage === undefined) {
            throw new Error("No config stages to load");
        }
        await this.load(stage, filename);
        return stage;
    }

    /**
     * Loads a specific config stage.
     * @param stage The stage to load.
     * @param filename Overrides the default config file if specified.
     */
    public async load(stage: number, filename?: string) {
        filename = filename ?? this.configFile;
        Logger.verbose(`Loading config stage ${stage}`);
        const entries = this.stages.get(stage);
        if (!entries) {
            Logger.warn("Trying to load a config stage that doesn't exist, skipping...");
            return;
        }
        Logger.debug(`Stage has ${entries.length} entries`);
        let content: string;
        let parsed: { [key: string]: any };
        try {
            content = await readFile(filename, "utf8");
            parsed = Serializer.parse(content);
        } catch {
            content = "";
            parsed = {};
        }
        for (const entry of entries) {
            const [data, comment] = entry.parse(parsed[entry.name]);
            parsed[entry.name] = data;
            if (comment) {
                Serializer.setComment(parsed, entry.name, comment);
            }
            entry.emit("loaded");
        }
        const newContent = Serializer.stringify(parsed);
        if (newContent !== content) {
            await writeFile(filename, newContent);
        }
        this.emit("loaded", stage);
    }

    /** Reloads the config handler */
    public async reload() {
        Logger.verbose("Reloading config...");
        this.orderedStages = undefined;
        while (this.hasNext()) {
            await this.loadNext();
        }
    }
}
