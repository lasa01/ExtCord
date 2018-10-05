import {EventEmitter} from "events";
import {promises as FS} from "fs";
import JSON5 from "json5";
import Winston from "winston";

import ConfigEntry from "./entry";

export default class Config extends EventEmitter {
    private logger: Winston.Logger;
    private entries: Map<string, ConfigEntry>;
    private stages: number[];

    constructor(logger: Winston.Logger) {
        super();
        this.logger = logger;
        this.entries = new Map();
        this.stages = [];
    }

    public register(entry: ConfigEntry) {
        this.entries.set(entry.name, entry);
        if (!this.stages.includes(entry.loadStage)) { this.stages.push(entry.loadStage); }
        entry.updateFullName();
    }

    public async load(stage: number, fileName: string) {
        if (!this.stages.includes(stage)) {
            this.logger.warn("Trying to load a config stage that doesn't exist, skipping...");
            return;
        }
        let content: string;
        let parsed: any;
        try {
            content = await FS.readFile(fileName, "utf8");
            parsed = JSON5.parse(content);
        } catch {
            content = "";
            parsed = {};
        }
        let updated = false;
        for (const [name, entry] of this.entries) {
            if (entry.loadStage !== stage) { continue; }
            let b: boolean;
            [b, parsed[name]] = entry.validate(parsed[name]);
            if (b) { updated = true; }
        }
        if (updated) {
            content = JSON5.stringify(parsed, undefined, 4);
            await FS.writeFile(fileName, content);
        }
        for (const [name, entry] of this.entries) {
            if (entry.loadStage !== stage) { continue; }
            entry.parse(parsed[name]);
            entry.emit("loaded");
        }
        this.emit("loaded", stage);
    }
}
