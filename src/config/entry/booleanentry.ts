import ConfigEntry, { IEntryInfo } from "./entry";

export default class BooleanConfigEntry extends ConfigEntry {
    private value?: boolean;
    private defaultValue?: boolean;

    constructor(info: IEntryInfo, defaultValue?: boolean) {
        super(info);
        this.defaultValue = defaultValue;
    }

    public get(): boolean {
        return this.value || this.defaultValue || false;
    }

    public parse(data: any, indent: number): [boolean, string] {
        if (typeof data === "boolean") {
            this.value = data;
            return [data, "  ".repeat(indent) + "# " + this.description];
        } else  {
            return [this.defaultValue || false, "  ".repeat(indent) + "# " + this.description];
        }
    }
}
