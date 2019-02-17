import EventEmitter from "events";
import Winston from "winston";

import Database from "../database/database";
import AsyncFS from "../util/asyncfs";
import HJSONC from "../util/hjsonc";
import ConfigEntry from "./entry/entry";
import BooleanConfigEntity from "./entry/guild/database/booleanconfigentity";
import NumberConfigEntity from "./entry/guild/database/numberconfigentity";
import StringConfigEntity from "./entry/guild/database/stringconfigentity";

export default class Config extends EventEmitter {
    public static registerDatabase(database: Database) {
        database.registerEntity(BooleanConfigEntity);
        database.registerEntity(NumberConfigEntity);
        database.registerEntity(StringConfigEntity);
    }

    private logger: Winston.Logger;
    private entries: Map<string, ConfigEntry>;
    private stages: Map<number, ConfigEntry[]>;
    private orderedStages?: number[];

    constructor(logger: Winston.Logger) {
        super();
        this.logger = logger;
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

    public hasNext() {
        if (!this.orderedStages) {
            return this.stages.size !== 0;
        } else {
            return this.orderedStages.length !== 0;
        }
    }

    public async loadNext(fileName: string): Promise<number> {
        if (!this.orderedStages) {
            this.orderedStages = Array.from(this.stages.keys());
            this.orderedStages.sort((a, b) => a - b);
        }
        const stage = this.orderedStages.shift();
        if (stage === undefined) {
            throw new Error("No config stages to load");
        }
        await this.load(stage, fileName);
        return stage;
    }

    public async load(stage: number, fileName: string) {
        this.logger.info(`Loading config stage ${stage}`);
        const entries = this.stages.get(stage);
        if (!entries) {
            this.logger.warn("Trying to load a config stage that doesn't exist, skipping...");
            return;
        }
        this.logger.debug(`Stage has ${entries.length} entries`);
        let content: string;
        let parsed: any;
        try {
            content = await AsyncFS.readFile(fileName, "utf8");
            parsed = HJSONC.parse(content);
        } catch {
            content = "";
            parsed = {};
        }
        for (const entry of entries) {
            const [data, comment] = entry.parse(parsed[entry.name]);
            parsed[entry.name] = data;
            parsed[entry.name + "__commentBefore__"] = comment;
            entry.emit("loaded");
        }
        content = HJSONC.stringify(parsed);
        await AsyncFS.writeFile(fileName, content);
        this.emit("loaded", stage);
    }
}
