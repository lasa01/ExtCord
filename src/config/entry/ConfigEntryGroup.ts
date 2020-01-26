import { Serializer } from "../../util/Serializer";
import { ConfigEntry, IEntryInfo } from "./ConfigEntry";

/**
 * A parent config entry that groups together child entries
 * @category Config
 */
export class ConfigEntryGroup extends ConfigEntry {
    /** The child entries of the entry group. */
    public entries: Map<string, ConfigEntry>;
    private value?: object;

    /**
     * Creates a new config entry group.
     * @param info Defines basic entry parameters.
     * @param entries Defines child entries for the entry group.
     */
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

    /**
     * Associate the specified config entries under the entry group.
     * @param entries Entries to add.
     */
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

    /**
     * Remove the specified config entries from the entry group.
     * @param entries Entries to remove.
     */
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
            if (comment) {
                Serializer.setComment(data, name, comment);
            }
        }
        this.value = data;
        return [data, this.description];
    }
}
