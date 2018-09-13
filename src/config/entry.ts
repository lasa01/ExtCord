export default class ConfigEntry implements EntryInfo {
    name: string;
    fullName: string;
    description?: string;
    optional?: boolean;
    value?: any;
    defaultValue?: any;
    type: "string" | "number" | "boolean" | "symbol" | "undefined" | "object" | "function";
    parent?: ConfigEntry;

    constructor(info: EntryInfo, defaultValue?: any, type = typeof defaultValue) {
        this.name = info.name;
        this.fullName = info.name;
        this.description = info.description;
        this.defaultValue = defaultValue;
        this.value = defaultValue;
        this.type = type;
    }
    
    setParent(parent: ConfigEntry) {
        this.parent = parent;
    }

    updateFullName() {
        if (this.parent) this.fullName = this.parent.fullName + '.' + this.name;
    }

    validate(data:any): any {
        return typeof data === this.type ? data : (this.optional ? undefined : this.defaultValue);
    }

    parse(data:any) {
        this.value = data;
    }
}

export interface EntryInfo {
    name: string,
    description?: string,
    optional?: boolean
}