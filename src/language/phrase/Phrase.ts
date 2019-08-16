import { EventEmitter } from "events";

// Event definitions
// tslint:disable-next-line:interface-name
export interface Phrase {
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

export abstract class Phrase extends EventEmitter {
    public name: string;
    public languages: string[];
    public description?: string;

    constructor(info: IPhraseInfo) {
        super();
        this.name = info.name;
        this.description = info.description;
        this.languages = [];
    }

    public abstract parse(language: string, data: any): [any, string?];
}

export interface IPhraseInfo {
    name: string;
    description?: string;
}
