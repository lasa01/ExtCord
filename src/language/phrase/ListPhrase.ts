import { DEFAULT_LANGUAGE } from "../Languages";
import { IPhraseInfo, Phrase } from "./Phrase";

/**
 * A phrase handling translations of a list of strings.
 * @category Language
 */
export class ListPhrase extends Phrase {
    protected defaults: Record<string, string[]>;
    protected templates: Record<string, string[]>;

    /**
     * Creates a new list phrase.
     * @param info Defines basic phrase parameters.
     * @param defaults Defines default translations for the phrase. If a string, assumed to be in [[DEFAULT_LANGUAGE]].
     */
    constructor(info: IPhraseInfo, defaults?: Record<string, string[]> | string[]) {
        super(info);
        if (!defaults) {
            defaults = [];
        }
        if (Array.isArray(defaults)) {
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
     * Gets the translated array of strings for the specified language.
     * @param language The language to use.
     */
    public get(language: string) {
        return this.templates[language] ?? [];
    }

    public parse(language: string, data: any): [string[], string?] {
        if (Array.isArray(data) && data.every((element) => typeof element === "string")) {
            this.templates[language] = data;
            return [data, this.description];
        } else {
            const defaultValue = this.defaults[language] ?? this.defaults[DEFAULT_LANGUAGE];
            this.templates[language] = defaultValue;
            return [defaultValue, this.description];
        }
    }
}
