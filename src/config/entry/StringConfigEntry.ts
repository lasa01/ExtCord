import { ConfigEntry, IEntryInfo } from "./ConfigEntry";

/**
 * A config entry that is a string.
 * @category Config
 */
export class StringConfigEntry extends ConfigEntry {
    private value?: string;
    private defaultValue?: string;

    /**
     * Creates a new string config entry.
     * @param info Defines basic entry parameters.
     * @param defaultValue Defines the default value.
     */
    constructor(info: IEntryInfo, defaultValue?: string) {
        super(info);
        this.defaultValue = defaultValue;
    }

    public get(): string {
        return this.value ?? this.defaultValue ?? "";
    }

    public parse(data: any): [string, string?] {
        if (typeof data === "string") {
            this.value = data;
            return [data, this.description];
        } else  {
            return [this.defaultValue ?? "", this.description];
        }
    }
}
