import JSON5 from 'json5';

import ConfigEntry from './entry';

export default class Config {
    entries: Map<string, ConfigEntry>;

    constructor() {
        this.entries = new Map();
    }

    register(entry: ConfigEntry) {
        this.entries.set(entry.name, entry);
    }
}