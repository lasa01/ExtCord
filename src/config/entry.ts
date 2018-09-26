import { EventEmitter } from "events";

export default class ConfigEntry extends EventEmitter implements IEntryInfo {
    public name: string;
    public fullName: string;
    public description?: string;
    public loadStage: number;
    public optional?: boolean;
    private value?: any;
    private defaultValue?: any;
    private type: "string" | "number" | "boolean" | "symbol" | "undefined" | "object" | "function";
    private parent?: ConfigEntry;

    constructor(info: IEntryInfo, defaultValue?: any, type = typeof defaultValue) {
        super();
        this.name = info.name;
        this.fullName = info.name;
        this.description = info.description;
        this.loadStage = info.loadStage == null ? 1 : info.loadStage;
        this.defaultValue = defaultValue;
        this.value = defaultValue;
        this.type = type;
    }

    public get() {
        return this.value;
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

    public validate(data: any): [boolean, any] {
        if (typeof data === this.type) { return  [false, data]; }
        if (this.optional) { return [true, undefined]; } else { return [true, this.defaultValue]; }
    }

    public parse(data: any) {
        this.value = data;
    }
}

export interface IEntryInfo {
    name: string;
    description?: string;
    optional?: boolean;
    loadStage?: number;
}
