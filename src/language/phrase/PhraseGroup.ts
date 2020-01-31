import { Serializer } from "../../util/Serializer";
import { IPhraseInfo, Phrase } from "./Phrase";

/**
 * A parent phrase that groups child phrases together.
 * @category Language
 */
export class PhraseGroup extends Phrase {
    /** The child phrases of the phrase group. */
    public phrases: Map<string, Phrase>;

    /**
     * Creates a new phrase group.
     * @param info Defines basic phrase parameters.
     * @param phrases Defines child phrases for the phrase group.
     */
    constructor(info: IPhraseInfo, phrases?: Phrase[]) {
        super(info);
        this.phrases = new Map();
        if (phrases) {
            for (const phrase of phrases) {
                this.phrases.set(phrase.name, phrase);
                for (const language of phrase.languages) {
                    if (!this.languages.includes(language)) {
                        this.languages.push(language);
                    }
                }
            }
        }
    }

    /**
     * Associate the specified phrases under the phrase group.
     * @param phrases Phrases to add.
     */
    public addPhrases(...phrases: Phrase[]) {
        for (const phrase of phrases) {
            if (this.phrases.has(phrase.name)) {
                throw new Error(`The phrase ${phrase.name} is already registered`);
            }
            this.phrases.set(phrase.name, phrase);
            for (const language of phrase.languages) {
                if (!this.languages.includes(language)) {
                    this.languages.push(language);
                }
            }
        }
    }

    /**
     * Remove the specified phrases from the phrase group.
     * @param phrases Phrases to remove.
     */
    public removePhrases(...phrases: Phrase[]) {
        for (const phrase of phrases) {
            if (this.phrases.has(phrase.name)) {
                this.phrases.delete(phrase.name);
            }
        }
    }

    public parse(language: string, data: any): [object, string?] {
        if (typeof data !== "object") {
            data = {};
        }
        for (const [name, phrase] of this.phrases) {
            const [parsed, comment] = phrase.parse(language, data[name]);
            data[name] = parsed;
            if (comment) {
                Serializer.setComment(data, name, comment);
            }
        }
        return [data, this.description];
    }
}
