import {EventEmitter} from "events";
import {promises as FS} from "fs";
import JSON5 from "json5";

import Bot from "../bot";
import ConfigEntry from "./entry";

export default class Config extends EventEmitter {
    private bot: Bot;
    private entries: Map<string, ConfigEntry>;
    private fileName: string;
    private stages: number[];

    constructor(bot: Bot, fileName: string) {
        super();
        this.bot = bot;
        this.fileName = fileName;
        this.entries = new Map();
        this.stages = [];
    }

    public register(entry: ConfigEntry) {
        this.entries.set(entry.name, entry);
        if (!this.stages.includes(entry.loadStage)) { this.stages.push(entry.loadStage); }
    }

    public async load(stage: number) {
        if (!this.stages.includes(stage)) {
            this.bot.logger.warn("Trying to load a config stage that doesn't exist, skipping...");
            return;
        }
        let content: string;
        let parsed: any;
        try {
            content = await FS.readFile(this.fileName, "utf8");
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
            await FS.writeFile(this.fileName, content);
        }
        for (const [name, entry] of this.entries) {
            if (entry.loadStage !== stage) { continue; }
            entry.parse(parsed[name]);
            entry.emit("loaded");
        }
        this.emit("loaded", stage);
    }
}
