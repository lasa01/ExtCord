import { DEFAULT_LANGUAGE } from "../Languages";
import { IPhraseInfo, Phrase } from "./Phrase";

/**
 * A simple phrase handling the translations of a single string.
 * @category Language
 */
export class SimplePhrase extends Phrase {
    protected templates: Record<string, string>;
    protected defaults: Record<string, string>;

    /**
     * Creates a new simple phrase.
     * @param info Defines basic phrase parameters.
     * @param defaults Defines default translations for the phrase. If a string, assumed to be in [[DEFAULT_LANGUAGE]].
     */
    constructor(info: IPhraseInfo, defaults: Record<string, string> | string) {
        super(info);
        if (typeof defaults === "string") {
            defaults = {
                [DEFAULT_LANGUAGE]: defaults,
            };
        }
        for (const language of Object.keys(defaults)) {
            if (!this.languages.includes(language)) {
                this.languages.push(language);
            }
        }
        this.defaults = defaults;
        this.templates = defaults;
    }

    /**
     * Gets the translated phrase for the specified language.
     * @param language The language to use.
     */
    public get(language: string) {
        return this.templates[language];
    }

    public parse(language: string, data: any): [string, string?] {
        if (typeof data === "string") {
            this.templates[language] = data;
            return [data, this.description];
        } else {
            const defaultValue = this.defaults[language] ?? this.defaults[DEFAULT_LANGUAGE];
            this.templates[language] = defaultValue;
            return [defaultValue, this.description];
        }
    }
}
