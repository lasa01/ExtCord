import format = require("string-format");

import { IPhraseInfo, Phrase } from "./phrase";

export class SimplePhrase extends Phrase {
    private defaults: { [key: string]: string };
    private templates: { [key: string]: string };

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

    public setTemplate(language: string, template: string) {
        this.templates[language] = template;
    }

    public format(language: string, stuff: { [key: string]: any } ) {
        return format(this.templates[language], stuff);
    }

    public parse(language: string, data: object): [string, string] {
        if (typeof data === "string") {
            this.templates[language] = data;
            return [data, this.description];
        } else  {
            return [this.defaults[language] || "", this.description];
        }
    }
}
