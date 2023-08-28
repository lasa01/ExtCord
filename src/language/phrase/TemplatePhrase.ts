import format = require("string-format");

import { IPhraseInfo } from "./Phrase";
import { SimplePhrase } from "./SimplePhrase";

/**
 * A template phrase that allows placeholders for dynamic strings.
 * @category Language
 */
export class TemplatePhrase<T extends Record<string, string>> extends SimplePhrase {
    /**
     * Creates a new template phrase.
     * @param info Defines basic phrase parameters.
     * @param defaults Defines default translations for the phrase. If a string, assumed to be in [[DEFAULT_LANGUAGE]].
     * @param templateDescription Descriptions of available placeholders. Keys are placeholders and values descriptions.
     */
    constructor(info: IPhraseInfo, defaults: Record<string, string> | string, templateDescription: T) {
        let description = (info.description ? info.description + "\n" : "") + "Available substitutes:";
        for (const [key, value] of Object.entries(templateDescription)) {
            description += `\n{${key}}: ${value}`;
        }
        info.description = description;
        super(info, defaults);
    }

    /**
     * Formats the translated phrase for the specified language with the supplied placeholder replacemets.
     * @param language The language to use.
     * @param stuff The placeholder replacements to use.
     */
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

    /**
     * Gets the phrase as a formatted list splitting the placeholders into their own strings.
     * @param language The language to use.
     * @param stuff The placeholder replacements to use.
     */
    public getParts<F extends Record<string, string>>(language: string, stuff?: TemplateStuff<T, F>): IResponsePart[] {
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

        const template = this.templates[language];
        const regex = /[{](.*?)[}]/g;
        const parts = [];

        var lastIndex = 0;
        var match = regex.exec(template);

        while (match !== null) {
            const partBefore = template.substring(lastIndex, match.index).trim();

            if (partBefore.length > 0) {
                parts.push({
                    text: partBefore,
                    template: false,
                });
            }

            const placeholderName = match[1];

            const part = processedStuff[placeholderName];

            if (part !== undefined && part.length > 0) {
                parts.push({
                    text: part,
                    template: true,
                });
            }

            lastIndex = regex.lastIndex;
            match = regex.exec(template);
        }

        const lastPart = template.substring(lastIndex).trim();

        if (lastPart.length > 0) {
            parts.push({
                text: lastPart,
                template: false,
            });
        }

        return parts;
    }
}

/**
 * An object of template placeholder replacements.
 * Keys are the placeholders and values are the replacements.
 * If the replacement is a string, it is used as-is.
 * If it is a simple phrase, it translated to the correct language before use.
 * If it is a tuple of a template phrase and replacements, it is translated and placeholders are replaced before use.
 * @category Language
 */
export type TemplateStuff<T extends Record<string, string>, U extends Record<string, string>> = {
    [P in keyof T]: T[P] | SimplePhrase | [TemplatePhrase<U>, U]
};

export interface IResponsePart {
    text: string;
    template: boolean;
};
