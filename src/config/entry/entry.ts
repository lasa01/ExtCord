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

export abstract class ConfigEntry extends EventEmitter implements IEntryInfo {
    public name: string;
    public fullName: string;
    public description?: string;
    public loadStage: number;
    private parent?: ConfigEntry;

    constructor(info: IEntryInfo) {
        super();
        this.name = info.name;
        this.fullName = info.name;
        this.description = info.description;
        this.loadStage = info.loadStage === undefined ? 1 : info.loadStage;
    }

    public setParent(parent: ConfigEntry) {
        this.parent = parent;
    }

    public removeParent() {
        this.parent = undefined;
    }

    public setLoadStage(stage: number) {
        this.loadStage = stage;
    }

    public updateFullName() {
        if (this.parent) { this.fullName = this.parent.fullName + "." + this.name; }
    }

    public print(): string {
        return `${this.name}: ${this.get()}`;
    }

    public abstract get(): any;

    public parse(data: any): [any, string?] {
        return [data, ""];
    }
}

export interface IEntryInfo {
    name: string;
    description?: string;
    // TODO Implement
    optional?: boolean;
    loadStage?: number;
}
