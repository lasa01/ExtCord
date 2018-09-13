import ConfigEntry, {EntryInfo} from './entry';

export default class EntryGroup extends ConfigEntry {
    entries: Map<string, ConfigEntry>;

    constructor(info: EntryInfo, entries: [ConfigEntry]) {
        super(info);
        this.entries = new Map();
        for (let entry of entries) {
            entry.setParent(this);
            this.entries.set(entry.name, entry);
        }
    }

    updateFullName() {
        super.updateFullName();
        for (let [, entry] of this.entries) {
            entry.updateFullName();
        } 
    }

    validate(data: any): any {
        for (let [name, entry] of this.entries) {
            data[name] = entry.validate(data[name]);
        }
        return data;
    }

    parse(data:any) {
        for (let [name, entry] of this.entries) {
            entry.parse(data[name]);
        }
    }
}