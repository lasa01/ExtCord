import { IPhraseInfo, Phrase } from "./phrase";

export class SimplePhrase extends Phrase {
    protected templates: { [key: string]: string };
    protected defaults: { [key: string]: string };

    constructor(info: IPhraseInfo, defaults: { [key: string]: string } | string) {
        super(info);
        if (typeof defaults === "string") {
            defaults = {
                // TODO get default language
                en: defaults,
            };
        }
        this.defaults = defaults;
        this.templates = defaults;
    }

    public get(language: string) {
        return this.templates[language];
    }

    public parse(language: string, data: object): [string, string?] {
        if (typeof data === "string") {
            this.templates[language] = data;
            return [data, this.description];
        } else  {
            return [this.defaults[language] || "", this.description];
        }
    }
}
