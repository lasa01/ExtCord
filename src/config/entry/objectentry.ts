import ConfigEntry, { IEntryInfo } from "./entry";

export default class ObjectConfigEntry extends ConfigEntry {
    private value?: object;
    private defaultValue?: object;

    constructor(info: IEntryInfo, defaultValue?: object) {
        super(info);
        this.defaultValue = defaultValue;
    }

    public get(): object {
        return this.value || this.defaultValue || {};
    }

    public parse(data: any, indent: number): [object, string] {
        if (typeof data === "object") {
            this.value = data;
            return [data, "  ".repeat(indent) + "# " + this.description];
        } else  {
            return [this.defaultValue || {}, "  ".repeat(indent) + "# " + this.description];
        }
    }
}
