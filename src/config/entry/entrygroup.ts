import { ConfigEntry, IEntryInfo } from "./entry";

export class ConfigEntryGroup extends ConfigEntry {
    public entries: Map<string, ConfigEntry>;
    private value?: object;

    constructor(info: IEntryInfo, entries?: ConfigEntry[]) {
        super(info);
        this.entries = new Map();
        if (entries) {
            for (const entry of entries) {
                entry.setParent(this);
                entry.setLoadStage(this.loadStage);
                this.entries.set(entry.name, entry);
            }
        }
    }

    public addEntries(...entries: ConfigEntry[]) {
        for (const entry of entries) {
            if (this.entries.has(entry.name)) {
                throw new Error(`The entry ${entry.name} is already registered`);
            }
            entry.setParent(this);
            entry.setLoadStage(this.loadStage);
            this.entries.set(entry.name, entry);
        }
    }

    public removeEntries(...entries: ConfigEntry[]) {
        for (const entry of entries) {
            if (this.entries.has(entry.name)) {
                entry.removeParent();
                this.entries.delete(entry.name);
            }
        }
    }

    public get() {
        return this.value;
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

    public parse(data: any): [any, string?] {
        if (typeof data !== "object") {
            data = {};
        }
        for (const [name, entry] of this.entries) {
            const [parsed, comment] = entry.parse(data[name]);
            data[name] = parsed;
            if (!data[name + "__commentBefore__"]) {
                Object.defineProperty(data, name + "__commentBefore__", { enumerable: false, writable: true});
                data[name + "__commentBefore__"] = comment;
            }
        }
        this.value = data;
        return [data, this.description];
    }
}
