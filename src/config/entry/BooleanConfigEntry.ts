import { ConfigEntry, IEntryInfo } from "./ConfigEntry";

/**
 * A config entry that is a boolean.
 * @category Config
 */
export class BooleanConfigEntry extends ConfigEntry {
    private value?: boolean;
    private defaultValue?: boolean;

    /**
     * Creates a new boolean config entry.
     * @param info Defines basic entry parameters.
     * @param defaultValue Defines the default value.
     */
    constructor(info: IEntryInfo, defaultValue?: boolean) {
        super(info);
        this.defaultValue = defaultValue;
    }

    public get(): boolean {
        return this.value ?? this.defaultValue ?? false;
    }

    public parse(data: any): [boolean, string?] {
        if (typeof data === "boolean") {
            this.value = data;
            return [data, this.description];
        } else  {
            return [this.defaultValue ?? false,  this.description];
        }
    }
}
