import format = require("string-format");

import { DEFAULT_LANGUAGE } from "../languages";
import { IBaseEmbed, IEmbedField, ILocalizedBaseEmbed, MessagePhrase } from "./messagephrase";
import { IPhraseInfo } from "./phrase";
import { ISimpleMap, SimplePhrase } from "./simplephrase";
import { TemplateStuff } from "./templatephrase";

export class DynamicFieldMessagePhrase<T extends ISimpleMap, U extends ISimpleMap> extends MessagePhrase<T> {
    protected defaultsField: ILocalizedEmbedField;
    protected templatesField: ILocalizedEmbedField;
    protected defaultsFieldText: ISimpleMap;
    protected templatesFieldText: ISimpleMap;
    private fieldDescription: string;

    constructor(
            info: IPhraseInfo, defaultsText: ISimpleMap | string, defaultsEmbed: ILocalizedBaseEmbed | IBaseEmbed,
            defaultsFieldText: ISimpleMap | string, defaultsField: ILocalizedEmbedField | IEmbedField,
            templateDescription: T, fieldTemplateDescription: U,
        ) {
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
        if (typeof parsed.textDynamicFields !== "string") {
            parsed.textDynamicFields = this.defaultsFieldText[language] || this.defaultsFieldText[DEFAULT_LANGUAGE];
        } else {
            this.templatesFieldText[language] = parsed.textDynamicFields;
        }
        if (typeof parsed.embed.dynamicFields !== "object") {
            parsed.embed.dynamicFields = this.defaultsField[language] || this.defaultsField[DEFAULT_LANGUAGE];
        } else {
            if (!this.templatesField[language]) {
                this.templatesField[language] = {
                    inline: false,
                    name: "",
                    value: "",
                };
            }
            if (typeof parsed.embed.dynamicFields.name !== "string") {
                parsed.embed.dynamicFields.name =
                    this.defaultsField[language].name || this.defaultsField[DEFAULT_LANGUAGE].name;
            } else {
                this.templatesField[language].name = parsed.embed.dynamicFields.name;
            }
            if (typeof parsed.embed.dynamicFields.value !== "string") {
                parsed.embed.dynamicFields.value =
                    this.defaultsField[language].value || this.defaultsField[DEFAULT_LANGUAGE].value;
            } else {
                this.templatesField[language].value = parsed.embed.dynamicFields.value;
            }
            if (typeof parsed.embed.dynamicFields.inline !== "boolean") {
                parsed.embed.dynamicFields.inline =
                    this.defaultsField[language].inline || this.defaultsField[DEFAULT_LANGUAGE].inline;
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

    public format<F extends ISimpleMap>(
        language: string, stuff?: TemplateStuff<T, F>, fieldStuff?: TemplateStuffs<U, F>,
    ) {
        let text = super.format(language, stuff);
        if (fieldStuff) {
            for (const fieldThing of fieldStuff) {
                if (fieldThing) {
                    const formattedFieldThing: { [key: string]: string } = {};
                    for (const [key, thing] of Object.entries(fieldThing)) {
                        if (thing instanceof SimplePhrase) {
                            formattedFieldThing[key] = thing.get(language);
                        } else if (Array.isArray(thing)) {
                            formattedFieldThing[key] = thing[0].format(language, thing[1]);
                        } else {
                            formattedFieldThing[key] = thing;
                        }
                    }
                    text += "/n" + format(this.templatesFieldText[language], formattedFieldThing);
                } else {
                    text += "/n";
                }
            }
        }
        return text;
    }

    public formatEmbed<F extends ISimpleMap>(
        language: string, stuff?: TemplateStuff<T, F>, fieldStuff?: TemplateStuffs<U, F>,
    ) {
        const embed = super.formatEmbed(language, stuff);
        if (fieldStuff) {
            const template = this.templatesField[language];
            for (const fieldThing of fieldStuff) {
                if (fieldThing) {
                    const formattedFieldThing: { [key: string]: string } = {};
                    for (const [key, thing] of Object.entries(fieldThing)) {
                        if (thing instanceof SimplePhrase) {
                            formattedFieldThing[key] = thing.get(language);
                        } else if (Array.isArray(thing)) {
                            formattedFieldThing[key] = thing[0].format(language, thing[1]);
                        } else {
                            formattedFieldThing[key] = thing;
                        }
                    }
                    embed.addField(format(template.name, formattedFieldThing),
                        format(template.value, formattedFieldThing), template.inline);
                } else {
                    embed.addBlankField();
                }
            }
        }
        return embed;
    }
}

export type TemplateStuffs<T extends ISimpleMap, U extends ISimpleMap> = Array<TemplateStuff<T, U>|undefined>;

export interface ILocalizedEmbedField {
    [key: string]: IEmbedField;
}
