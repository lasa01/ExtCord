import format = require("string-format");

import { IPhraseInfo } from "./phrase";
import { ISimpleMap, SimplePhrase } from "./simplephrase";

export class TemplatePhrase<T extends ISimpleMap> extends SimplePhrase {
    constructor(info: IPhraseInfo, defaults: ISimpleMap | string, templateDescription: T) {
        let description = (info.description ? info.description + "\n" : "") + "Available substitutes:";
        for (const [key, value] of Object.entries(templateDescription)) {
            description += `\n{${key}}: ${value}`;
        }
        info.description = description;
        super(info, defaults);
    }

    public format<F extends ISimpleMap>(language: string, stuff?: TemplateStuff<T, F>) {
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

export type TemplateStuff<T extends ISimpleMap, U extends ISimpleMap> = {
    [P in keyof T]: T[P]|SimplePhrase|[TemplatePhrase<U>, U]
};
