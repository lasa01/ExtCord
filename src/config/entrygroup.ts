import ConfigEntry, {IEntryInfo} from "./entry";

export default class EntryGroup extends ConfigEntry {
    private entries: Map<string, ConfigEntry>;

    constructor(info: IEntryInfo, entries: [ConfigEntry]) {
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

    public validate(data: any): [boolean, any] {
        let updated = false;
        for (const [name, entry] of this.entries) {
            let u: boolean;
            [u, data[name]] = entry.validate(data[name]);
            if (u) { updated = true; }
        }
        return [updated, data];
    }

    public parse(data: any) {
        for (const [name, entry] of this.entries) {
            entry.parse(data[name]);
        }
    }
}
