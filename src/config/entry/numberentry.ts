import { ConfigEntry, IEntryInfo } from "./entry";

export class NumberConfigEntry extends ConfigEntry {
    private value?: number;
    private defaultValue?: number;

    constructor(info: IEntryInfo, defaultValue?: number) {
        super(info);
        this.defaultValue = defaultValue;
    }

    public get(): number {
        return this.value || this.defaultValue || 0;
    }

    public parse(data: any): [number, string?] {
        if (typeof data === "number") {
            this.value = data;
            return [data, this.description];
        } else  {
            return [this.defaultValue || 0, this.description];
        }
    }
}
