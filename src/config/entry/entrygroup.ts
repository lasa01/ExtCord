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

    public parse(data: any): [object, string] {
        if (typeof data !== "object") {
            data = {};
        }
        for (const [name, entry] of this.entries) {
            const [parsed, comment] = entry.parse(data[name]);
            data[name] = parsed;
            data[name + "__commentBefore__"] = comment;
        }
        return [data, "# " + this.description];
    }
}
