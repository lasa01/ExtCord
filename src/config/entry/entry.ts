import { EventEmitter } from "events";

export default abstract class ConfigEntry extends EventEmitter implements IEntryInfo {
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

    public get(): any {
        return;
    }

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
