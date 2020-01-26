import { ConfigEntry, IEntryInfo } from "./ConfigEntry";

/**
 * A config entry that is a number.
 * @category Config
 */
export class NumberConfigEntry extends ConfigEntry {
    private value?: number;
    private defaultValue?: number;

    /**
     * Creates a new number config entry.
     * @param info Defines basic entry parameters.
     * @param defaultValue Defines the default value.
     */
    constructor(info: IEntryInfo, defaultValue?: number) {
        super(info);
        this.defaultValue = defaultValue;
    }

    public get(): number {
        return this.value ?? this.defaultValue ?? 0;
    }

    public parse(data: any): [number, string?] {
        if (typeof data === "number") {
            this.value = data;
            return [data, this.description];
        } else  {
            return [this.defaultValue ?? 0, this.description];
        }
    }
}
