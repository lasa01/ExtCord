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

/**
 * A generic abstract base class for all phrases.
 * @category Language
 */
export abstract class Phrase extends EventEmitter {
    /** The name the phrase is registered by internally. */
    public name: string;
    /** The languages the phrase is available in. */
    public languages: string[];
    /** The description of the phrase. */
    public description?: string;

    /**
     * Creates a new phrase.
     * @param info Defines basic phrase parameters.
     */
    constructor(info: IPhraseInfo) {
        super();
        this.name = info.name;
        this.description = info.description;
        this.languages = [];
    }

    /**
     * Parses and stores the value of the phrase in the given language from the passed data.
     * @param language The language of the data.
     * @param data The data to parse the value from.
     */
    public abstract parse(language: string, data: any): [any, string?];
}

/**
 * Defines basic language phrase parameters common to all phrases.
 * @category Language
 */
export interface IPhraseInfo {
    /** Name of the phrase. Must be unique among siblings. */
    name: string;
    /** Description of the phrase. */
    description?: string;
}
