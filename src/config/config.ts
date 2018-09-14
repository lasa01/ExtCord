import {promises as FS} from "fs";
import JSON5 from "json5";

import ConfigEntry from "./entry";

export default class Config {
    private entries: Map<string, ConfigEntry>;
    private fileName: string;

    constructor(fileName: string) {
        this.fileName = fileName;
        this.entries = new Map();
    }

    public register(entry: ConfigEntry) {
        this.entries.set(entry.name, entry);
    }

    public async load(stage: number) {
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
            entry.parse(parsed[name]);
        }
    }
}
