import ConfigEntry, { IEntryInfo } from "./entry";

export default class StringConfigEntry extends ConfigEntry {
    private value?: string;
    private defaultValue?: string;

    constructor(info: IEntryInfo, defaultValue?: string) {
        super(info);
        this.defaultValue = defaultValue;
    }

    public get(): string {
        return this.value || this.defaultValue || "";
    }

    public parse(data: any): [string, string] {
        if (typeof data === "string") {
            this.value = data;
            return [data, "# " + this.description];
        } else  {
            return [this.defaultValue || "", "# " + this.description];
        }
    }
}
