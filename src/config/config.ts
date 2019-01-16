import { EventEmitter } from "events";
import FS from "fs";
import Hjson from "hjson";
import Winston from "winston";

import Database from "../database/database";
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
        if (stage == null) {
            throw new Error("No config stages to load");
        }
        await this.load(stage, fileName);
        return stage;
    }

    public async load(stage: number, fileName: string) {
        const readFile = (file: string) => new Promise<string>((resolve, reject) =>
            FS.readFile(file, "utf8", (err, data) => { if (err) { reject(err); } else { resolve(data); } }));
        const writeFile = (file: string, data: string) => new Promise<void>((resolve, reject) =>
            FS.writeFile(file, data, (err) => { if (err) { reject(err); } else { resolve(); } }));

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
            content = await readFile(fileName);
            parsed = Hjson.parse(content, { keepWsc: true });
        } catch {
            content = "";
            parsed = {};
        }
        // If it works, don't touch it (it works)
        if (!parsed.__COMMENTS__) {
            parsed.__COMMENTS__ = {};
        }
        if (!parsed.__COMMENTS__.c) {
            parsed.__COMMENTS__.c = {};
        }
        if (!parsed.__COMMENTS__.o) {
            parsed.__COMMENTS__.o = [];
        }
        for (const entry of entries) {
            const [data, comment] = entry.parse(parsed[entry.name], 1);
            parsed[entry.name] = data;
            if (!parsed.__COMMENTS__.o.includes(entry.name)) { parsed.__COMMENTS__.o.push(entry.name); }
            if (!parsed.__COMMENTS__.c[entry.name]) {
                parsed.__COMMENTS__.c[entry.name] = ["", ""];
            }
            if (!parsed.__COMMENTS__.c[entry.name][0]) {
                parsed.__COMMENTS__.c[entry.name][0] = comment;
            }
            entry.emit("loaded");
        }
        content = Hjson.stringify(parsed, { keepWsc: true });
        // Some kind of weird bug, this fixes it, TODO figure out something better
        parsed = Hjson.parse(content, { keepWsc: true });
        content = Hjson.stringify(parsed, { keepWsc: true });
        await writeFile(fileName, content);
        this.emit("loaded", stage);
    }
}
