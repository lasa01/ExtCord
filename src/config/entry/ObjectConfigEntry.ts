import { ConfigEntry, IEntryInfo } from "./ConfigEntry";

/**
 * A config entry that can be any object.
 * @category Config
 */
export class ObjectConfigEntry extends ConfigEntry {
    private value?: object;
    private defaultValue?: object;

    /**
     * Creates a new object config entry.
     * @param info Defines basic entry parameters.
     * @param defaultValue Defines the default value.
     */
    constructor(info: IEntryInfo, defaultValue?: object) {
        super(info);
        this.defaultValue = defaultValue;
    }

    public get(): object {
        return this.value ?? this.defaultValue ?? {};
    }

    public parse(data: any): [object, string?] {
        if (typeof data === "object") {
            this.value = data;
            return [data, this.description];
        } else  {
            return [this.defaultValue ?? {}, this.description];
        }
    }
}
