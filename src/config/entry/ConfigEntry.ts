import { EventEmitter } from "events";

// Event definitions
// tslint:disable-next-line:interface-name
export interface ConfigEntry {
    /** @event */
    addListener(event: "loaded", listener: () => void): this;
    /** @event */
    emit(event: "loaded"): boolean;
    /** @event */
    on(event: "loaded", listener: () => void): this;
    /** @event */
    once(event: "loaded", listener: () => void): this;
    /** @event */
    prependListener(event: "loaded", listener: () => void): this;
    /** @event */
    prependOnceListener(event: "loaded", listener: () => void): this;
}

/**
 * A generic abstract base class for all config entries.
 * @category Config
 */
export abstract class ConfigEntry extends EventEmitter implements IEntryInfo {
    /** The name the config entry is registered by internally. */
    public name: string;
    /** The full name of the entry, including possible parents. */
    public fullName: string;
    /** The description of the config entry. */
    public description?: string;
    /** The config stage the entry is loaded in. */
    public loadStage: number;
    private parent?: ConfigEntry;

    /**
     * Creates a new config entry.
     * @param info Defines basic entry parameters.
     */
    constructor(info: IEntryInfo) {
        super();
        this.name = info.name;
        this.fullName = info.name;
        this.description = info.description;
        this.loadStage = info.loadStage === undefined ? 1 : info.loadStage;
    }

    /**
     * Sets the parent of the entry.
     * @param parent The new parent.
     */
    public setParent(parent: ConfigEntry) {
        this.parent = parent;
    }

    /** Removes any parent definitions from the entry. */
    public removeParent() {
        this.parent = undefined;
    }

    /**
     * Sets the load stage of the entry.
     * @param stage The new load stage.
     */
    public setLoadStage(stage: number) {
        this.loadStage = stage;
    }

    /** Updates the full name of the entry to include possible parent's names. */
    public updateFullName() {
        if (this.parent) { this.fullName = this.parent.fullName + "." + this.name; }
    }

    /** Gets a string representation of the entry. */
    public print(): string {
        return `${this.name}: ${this.get()}`;
    }

    /** Gets the current value of the entry. */
    public abstract get(): any;

    /**
     * Parses the value of the entry from the passed data.
     * @param data Data to parse the value from.
     */
    public parse(data: any): [any, string?] {
        return [data, ""];
    }
}

/**
 * Defines basic config entry parameters common to all config entries.
 * @category Config
 */
export interface IEntryInfo {
    /** Name of the config entry. Must be unique among siblings. */
    name: string;
    /** Description of the config entry. */
    description?: string;
    // TODO Implement
    optional?: boolean;
    /** The config stage to load the entry in. */
    loadStage?: number;
}
