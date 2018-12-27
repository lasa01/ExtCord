import ConfigEntry, { IEntryInfo } from "./entry";

export default class ConfigEntryGroup extends ConfigEntry {
    public entries: Map<string, ConfigEntry>;

    constructor(info: IEntryInfo, entries: ConfigEntry[]) {
        super(info);
        this.entries = new Map();
        for (const entry of entries) {
            entry.setParent(this);
            entry.setLoadStage(this.loadStage);
            this.entries.set(entry.name, entry);
        }
    }

    public setLoadStage(stage: number) {
        super.setLoadStage(stage);
        for (const [, entry] of this.entries) {
            entry.setLoadStage(stage);
        }
    }

    public updateFullName() {
        super.updateFullName();
        for (const [, entry] of this.entries) {
            entry.updateFullName();
        }
    }

    public print(): string {
        let out = `${this.name}:`;
        for (const [, entry] of this.entries) {
            const lines = entry.print().split("\n");
            for (const line of lines) {
                out += `\n    ${line}`;
            }
        }
        return out;
    }

    public parse(data: any, indent: number): [object, string] {
        if (typeof data !== "object") {
            data = {};
        }
        // If it works, don't touch it (it works)
        if (!data.__COMMENTS__) {
            data.__COMMENTS__ = {};
        }
        if (!data.__COMMENTS__.c) {
            data.__COMMENTS__.c = {};
        }
        if (!data.__COMMENTS__.o) {
            data.__COMMENTS__.o = [];
        }
        for (const [name, entry] of this.entries) {
            const [parsed, comment] = entry.parse(data[name], indent + 1);
            data[name] = parsed;
            if (!data.__COMMENTS__.o.includes(entry.name)) { data.__COMMENTS__.o.push(entry.name); }
            if (!data.__COMMENTS__.c[entry.name]) {
                data.__COMMENTS__.c[entry.name] = ["", ""];
            }
            if (!data.__COMMENTS__.c[entry.name][0]) {
                data.__COMMENTS__.c[entry.name][0] = comment;
            }
        }
        return [data, "  ".repeat(indent) + "# " + this.description];
    }
}
