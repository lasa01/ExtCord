import format = require("string-format");

import { IPhraseInfo } from "./Phrase";
import { SimplePhrase } from "./SimplePhrase";

export class TemplatePhrase<T extends Record<string, string>> extends SimplePhrase {
    constructor(info: IPhraseInfo, defaults: Record<string, string> | string, templateDescription: T) {
        let description = (info.description ? info.description + "\n" : "") + "Available substitutes:";
        for (const [key, value] of Object.entries(templateDescription)) {
            description += `\n{${key}}: ${value}`;
        }
        info.description = description;
        super(info, defaults);
    }

    public format<F extends Record<string, string>>(language: string, stuff?: TemplateStuff<T, F>) {
        const processedStuff: { [key: string]: string } = {};
        if (stuff) {
            for (const [key, thing] of Object.entries(stuff)) {
                if (thing instanceof SimplePhrase) {
                    processedStuff[key] = thing.get(language);
                } else if (Array.isArray(thing)) {
                    processedStuff[key] = thing[0].format(language, thing[1]);
                } else {
                    processedStuff[key] = thing;
                }
            }
        }
        return format(this.templates[language], processedStuff);
    }
}

export type TemplateStuff<T extends Record<string, string>, U extends Record<string, string>> = {
    [P in keyof T]: T[P]|SimplePhrase|[TemplatePhrase<U>, U]
};
