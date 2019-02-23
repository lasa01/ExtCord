import { EventEmitter } from "events";
import { Logger } from "winston";

import { Database } from "../database/database";
import { readFile, writeFile } from "../util/asyncfs";
import { parse, stringify } from "../util/serializer";
import { ConfigEntry } from "./entry/entry";
import { BooleanConfigEntity } from "./entry/guild/database/booleanconfigentity";
import { NumberConfigEntity } from "./entry/guild/database/numberconfigentity";
import { StringConfigEntity } from "./entry/guild/database/stringconfigentity";

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

    // Strongly typed events

    public addListener(event: "loaded", listener: (stage: number) => void): this;
    public addListener(event: string, listener: (...args: any[]) => void) { return super.addListener(event, listener); }

    public emit(event: "loaded", stage: number): boolean;
    public emit(event: string, ...args: any[]) { return super.emit(event, ...args); }

    public on(event: "loaded", listener: (stage: number) => void): this;
    public on(event: string, listener: (...args: any[]) => void) { return super.on(event, listener); }

    public once(event: "loaded", listener: (stage: number) => void): this;
    public once(event: string, listener: (...args: any[]) => void) { return super.once(event, listener); }

    public prependListener(event: "loaded", listener: (stage: number) => void): this;
    public prependListener(event: string, listener: (...args: any[]) => void) {
        return super.prependListener(event, listener);
    }

    public prependOnceListener(event: "loaded", listener: (stage: number) => void): this;
    public prependOnceListener(event: string, listener: (...args: any[]) => void) {
        return super.prependOnceListener(event, listener);
    }

    public register(entry: ConfigEntry) {
        this.logger.debug(`Registering config entry ${entry.name}`);
        this.entries.set(entry.name, entry);
        const stage = this.stages.get(entry.loadStage) || [];
        stage.push(entry);
        if (!this.stages.has(entry.loadStage)) { this.stages.set(entry.loadStage, stage); }
        entry.updateFullName();
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
            parsed = parse(content);
        } catch {
            content = "";
            parsed = {};
        }
        for (const entry of entries) {
            const [data, comment] = entry.parse(parsed[entry.name]);
            parsed[entry.name] = data;
            if (!parsed[entry.name + "__commentBefore__"] && comment) {
                Object.defineProperty(parsed, entry.name + "__commentBefore__", { enumerable: false, writable: true});
                parsed[entry.name + "__commentBefore__"] = comment;
            }
            entry.emit("loaded");
        }
        const newContent = stringify(parsed);
        if (newContent !== content) {
            await writeFile(filename, newContent);
        }
        this.emit("loaded", stage);
    }
}
