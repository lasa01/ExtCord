import { EventEmitter } from "events";

export abstract class ConfigEntry extends EventEmitter implements IEntryInfo {
    public name: string;
    public fullName: string;
    public description: string;
    public loadStage: number;
    private parent?: ConfigEntry;

    constructor(info: IEntryInfo) {
        super();
        this.name = info.name;
        this.fullName = info.name;
        this.description = info.description;
        this.loadStage = info.loadStage === undefined ? 1 : info.loadStage;
    }

    // Strongly typed events

    public addListener(event: "loaded", listener: () => void): this;
    public addListener(event: string, listener: (...args: any[]) => void) { return super.addListener(event, listener); }

    public emit(event: "loaded"): boolean;
    public emit(event: string, ...args: any[]) { return super.emit(event, ...args); }

    public on(event: "loaded", listener: () => void): this;
    public on(event: string, listener: (...args: any[]) => void) { return super.on(event, listener); }

    public once(event: "loaded", listener: () => void): this;
    public once(event: string, listener: (...args: any[]) => void) { return super.once(event, listener); }

    public prependListener(event: "loaded", listener: () => void): this;
    public prependListener(event: string, listener: (...args: any[]) => void) {
        return super.prependListener(event, listener);
    }

    public prependOnceListener(event: "loaded", listener: () => void): this;
    public prependOnceListener(event: string, listener: (...args: any[]) => void) {
        return super.prependOnceListener(event, listener);
    }

    public setParent(parent: ConfigEntry) {
        this.parent = parent;
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

    public parse(data: any): [any, string] {
        return [data, ""];
    }
}

export interface IEntryInfo {
    name: string;
    description: string;
    // TODO Implement
    optional?: boolean;
    loadStage?: number;
}
