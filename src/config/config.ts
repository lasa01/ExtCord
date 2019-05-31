import { EventEmitter } from "events";
import { readFile, writeFile } from "fs-extra";
import { Logger } from "winston";

import { Database } from "../database/database";
import { Serializer } from "../util/serializer";
import { ConfigEntry } from "./entry/entry";
import { BooleanConfigEntity } from "./entry/guild/database/booleanconfigentity";
import { NumberConfigEntity } from "./entry/guild/database/numberconfigentity";
import { StringConfigEntity } from "./entry/guild/database/stringconfigentity";

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

export class Config extends EventEmitter {
    public static registerDatabase(database: Database) {
        database.registerEntity(BooleanConfigEntity);
        database.registerEntity(NumberConfigEntity);
        database.registerEntity(StringConfigEntity);
    }

    private logger: Logger;
    private configFile: string;
    private entries: Map<string, ConfigEntry>;
    private stages: Map<number, ConfigEntry[]>;
    private orderedStages?: number[];

    constructor(logger: Logger, configFile: string) {
        super();
        this.logger = logger;
        this.configFile = configFile;
        this.entries = new Map();
        this.stages = new Map();
    }

    public register(entry: ConfigEntry) {
        this.logger.debug(`Registering config entry ${entry.name}`);
        this.entries.set(entry.name, entry);
        const stage = this.stages.get(entry.loadStage) || [];
        stage.push(entry);
        if (!this.stages.has(entry.loadStage)) { this.stages.set(entry.loadStage, stage); }
        entry.updateFullName();
    }

    public unregister(entry: ConfigEntry) {
        this.entries.delete(entry.name);
        const stage = this.stages.get(entry.loadStage)!;
        stage.splice(stage.indexOf(entry));
    }

    public hasNext() {
        if (!this.orderedStages) {
            return this.stages.size !== 0;
        } else {
            return this.orderedStages.length !== 0;
        }
    }

    public async loadNext(filename?: string): Promise<number> {
        filename = filename || this.configFile;
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

    public async load(stage: number, filename?: string) {
        filename = filename || this.configFile;
        this.logger.info(`Loading config stage ${stage}`);
        const entries = this.stages.get(stage);
        if (!entries) {
            this.logger.warn("Trying to load a config stage that doesn't exist, skipping...");
            return;
        }
        this.logger.debug(`Stage has ${entries.length} entries`);
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
            if (!parsed[entry.name + "__commentBefore__"] && comment) {
                Object.defineProperty(parsed, entry.name + "__commentBefore__", { enumerable: false, writable: true });
                parsed[entry.name + "__commentBefore__"] = comment;
            }
            entry.emit("loaded");
        }
        const newContent = Serializer.stringify(parsed);
        if (newContent !== content) {
            await writeFile(filename, newContent);
        }
        this.emit("loaded", stage);
    }
}
