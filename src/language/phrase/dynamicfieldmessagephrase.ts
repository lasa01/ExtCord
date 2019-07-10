import format = require("string-format");

import { DEFAULT_LANGUAGE } from "../languages";
import { IBaseEmbed, IEmbedField, ILocalizedBaseEmbed, MessagePhrase } from "./messagephrase";
import { IPhraseInfo } from "./phrase";
import { SimplePhrase } from "./simplephrase";
import { TemplatePhrase } from "./templatephrase";

export class DynamicFieldMessagePhrase<T extends { [key: string]: string; },
    U extends { [key: string]: string; }> extends MessagePhrase<T> {
    protected defaultsField: ILocalizedEmbedField;
    protected templatesField: ILocalizedEmbedField;
    protected defaultsFieldText: { [key: string]: string };
    protected templatesFieldText: { [key: string]: string };
    private fieldDescription: string;

    constructor(info: IPhraseInfo, defaultsText: { [key: string]: string } | string,
                defaultsEmbed: ILocalizedBaseEmbed | IBaseEmbed, defaultsFieldText: { [key: string]: string } | string,
                defaultsField: ILocalizedEmbedField | IEmbedField,
                templateDescription: T, fieldTemplateDescription: U ) {
        super(info, defaultsText, defaultsEmbed, templateDescription);
        if (typeof defaultsFieldText === "string") {
            defaultsFieldText = {
                [DEFAULT_LANGUAGE]: defaultsFieldText,
            };
        }
        if (typeof defaultsField.inline === "boolean") {
            defaultsField = {
                [DEFAULT_LANGUAGE]: defaultsField as IEmbedField,
            };
        }
        this.defaultsFieldText = defaultsFieldText;
        this.templatesFieldText = defaultsFieldText;
        this.defaultsField = defaultsField as ILocalizedEmbedField;
        this.templatesField = this.defaultsField;
        this.fieldDescription = "Available substitutes:";
        for (const [key, value] of Object.entries(fieldTemplateDescription)) {
            this.fieldDescription += `\n{${key}}: ${value}`;
        }
    }

    public parse(language: string, data: any): [any, string?] {
        const [parsed, comment] = super.parse(language, data);
        if (typeof parsed.embed.dynamicFields !== "object") {
            parsed.embed.dynamicFields = this.defaultsField[language];
        } else {
            if (!this.templatesField[language]) {
                this.templatesField[language] = {
                    inline: false,
                    name: "",
                    value: "",
                };
            }
            if (typeof parsed.embed.dynamicFields.name !== "string") {
                parsed.embed.dynamicFields.name = this.defaultsField[language].name;
            } else {
                this.templatesField[language].name = parsed.embed.dynamicFields.name;
            }
            if (typeof parsed.embed.dynamicFields.value !== "string") {
                parsed.embed.dynamicFields.value = this.defaultsField[language].value;
            } else {
                this.templatesField[language].value = parsed.embed.dynamicFields.value;
            }
            if (typeof parsed.embed.dynamicFields.inline !== "boolean") {
                parsed.embed.dynamicFields.inline = this.defaultsField[language].inline;
            } else {
                this.templatesField[language].inline = parsed.embed.dynamicFields.inline;
            }
        }
        if (!parsed.embed.dynamicFields__commentBefore__ ||
            typeof parsed.embed.dynamicFields__commentBefore__ !== "string") {
            Object.defineProperty(parsed.embed, "dynamicFields__commentBefore__", { enumerable: false, writable: true});
            parsed.embed.dynamicFields__commentBefore__ = this.fieldDescription;
        }
        return [parsed, comment];
    }

    public format(language: string, stuff?: { [P in keyof T]: T[P]|SimplePhrase|TemplatePhrase<T> },
                  fieldStuff?: Array<{ [P in keyof U]: U[P]|SimplePhrase|TemplatePhrase<U> }|undefined>) {
        let text = super.format(language, stuff);
        if (fieldStuff) {
            for (const fieldThing of fieldStuff) {
                if (fieldThing) {
                    for (const [key, thing] of Object.entries(fieldThing)) {
                        if (thing instanceof SimplePhrase && thing !== this) {
                            fieldThing[key as keyof U] = thing instanceof TemplatePhrase ?
                            thing.format(language, fieldThing)  as U[keyof U] :
                            thing.get(language) as U[keyof U];
                        }
                    }
                    text += "/n" + format(this.templatesFieldText[language], fieldThing);
                } else {
                    text += "/n";
                }
            }
        }
        return text;
    }

    public formatEmbed(language: string, stuff?: { [P in keyof T]: T[P]|SimplePhrase|TemplatePhrase<T> },
                       fieldStuff?: Array<{ [P in keyof U]: U[P]|SimplePhrase|TemplatePhrase<U> }|undefined>) {
        const embed = super.formatEmbed(language, stuff);
        if (fieldStuff) {
            const template = this.templatesField[language];
            for (const fieldThing of fieldStuff) {
                if (fieldThing) {
                    for (const [key, thing] of Object.entries(fieldThing)) {
                        if (thing instanceof SimplePhrase && thing !== this) {
                            fieldThing[key as keyof U] = thing instanceof TemplatePhrase ?
                            thing.format(language, fieldThing)  as U[keyof U] :
                            thing.get(language) as U[keyof U];
                        }
                    }
                    embed.addField(format(template.name, fieldThing), format(template.value, fieldThing),
                        template.inline);
                } else {
                    embed.addBlankField();
                }
            }
        }
        return embed;
    }
}

interface ILocalizedEmbedField {
    [key: string]: IEmbedField;
}
