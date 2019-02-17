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

    public parse(data: any): [boolean, string] {
        if (typeof data === "boolean") {
            this.value = data;
            return [data, "# " + this.description];
        } else  {
            return [this.defaultValue || false, "# " + this.description];
        }
    }
}
