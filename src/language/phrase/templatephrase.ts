import format = require("string-format");

import { IPhraseInfo } from "./phrase";
import { SimplePhrase } from "./simplephrase";

export class TemplatePhrase<T extends { [key: string]: string }> extends SimplePhrase {
    constructor(info: IPhraseInfo, defaults: { [key: string]: string; } | string, templateDescription: T) {
        let description = (info.description ? info.description + "\n" : "") + "Available substitutes:";
        for (const [key, value] of Object.entries(templateDescription)) {
            description += `\n{${key}}: ${value}`;
        }
        info.description = description;
        super(info, defaults);
    }

    public format(language: string, stuff?: { [P in keyof T]: T[P]|SimplePhrase|TemplatePhrase<T> }) {
        if (stuff) {
            for (const [key, thing] of Object.entries(stuff)) {
                if (thing instanceof SimplePhrase && thing !== this) {
                    stuff[key as keyof T] = thing instanceof TemplatePhrase ?
                        thing.format(language, stuff)  as T[keyof T] :
                        thing.get(language) as T[keyof T];
                }
            }
        }
        return format(this.templates[language], stuff || {});
    }
}
