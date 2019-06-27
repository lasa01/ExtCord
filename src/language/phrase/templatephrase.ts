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

    public format(language: string, stuff?: T ) {
        return format(this.templates[language], stuff || {});
    }
}
