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

    public parse(data: any, indent: number): [string, string] {
        if (typeof data === "string") {
            this.value = data;
            return [data, "  ".repeat(indent) + "# " + this.description];
        } else  {
            return [this.defaultValue || "", "  ".repeat(indent) + "# " + this.description];
        }
    }
}
