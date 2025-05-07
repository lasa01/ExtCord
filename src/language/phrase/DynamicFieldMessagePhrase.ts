import format = require("string-format");

import { DEFAULT_LANGUAGE } from "../Languages";
import { IBaseEmbed, IEmbedField, ILocalizedBaseEmbed, MessagePhrase } from "./MessagePhrase";
import { IPhraseInfo } from "./Phrase";
import { SimplePhrase } from "./SimplePhrase";
import { TemplateStuff } from "./TemplatePhrase";

/**
 * A phrase handling the translations of a message template with dynamic number of embed fields.
 * @category Language
 */
export class DynamicFieldMessagePhrase<T extends Record<string, string>, U extends Record<string, string>>
    extends MessagePhrase<T> {
    protected defaultsField: ILocalizedEmbedField;
    protected templatesField: ILocalizedEmbedField;
    protected defaultsFieldText: Record<string, string>;
    protected templatesFieldText: Record<string, string>;
    private fieldDescription: string;

    /**
     * Creates a new dynamic field message phrase.
     * @param info Defines basic phrase parameters.
     * @param defaultsText Defines default translations for the text-only version of the message.
     * @param defaultsEmbed Defines default translations for the embed version of the message.
     * @param defaultsFieldText Defines default translations for the text-only version of the dynamic fields.
     * @param defaultsField Defines default translations for the embed version of the dynamic fields.
     * @param templateDescription Descriptions of available placeholders. Keys are placeholders and values descriptions.
     * @param fieldTemplateDescription Descriptions of available placeholders for the dynamic fields.
     */
    constructor(
        info: IPhraseInfo,
        defaultsText: Record<string, string> | string, defaultsEmbed: ILocalizedBaseEmbed | IBaseEmbed,
        defaultsFieldText: Record<string, string> | string, defaultsField: ILocalizedEmbedField | IEmbedField,
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
            const defaultValue = this.defaultsFieldText[language] ?? this.defaultsFieldText[DEFAULT_LANGUAGE];
            this.templatesFieldText[language] = defaultValue;
            parsed.textDynamicFields = defaultValue;
        } else {
            this.templatesFieldText[language] = parsed.textDynamicFields;
        }
        if (typeof parsed.embed.dynamicFields !== "object") {
            parsed.embed.dynamicFields = this.defaultsField[language] ?? this.defaultsField[DEFAULT_LANGUAGE];
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
                    this.defaultsField[language].name ?? this.defaultsField[DEFAULT_LANGUAGE].name;
            } else {
                this.templatesField[language].name = parsed.embed.dynamicFields.name;
            }
            if (typeof parsed.embed.dynamicFields.value !== "string") {
                parsed.embed.dynamicFields.value =
                    this.defaultsField[language].value ?? this.defaultsField[DEFAULT_LANGUAGE].value;
            } else {
                this.templatesField[language].value = parsed.embed.dynamicFields.value;
            }
            if (typeof parsed.embed.dynamicFields.inline !== "boolean") {
                parsed.embed.dynamicFields.inline =
                    this.defaultsField[language].inline ?? this.defaultsField[DEFAULT_LANGUAGE].inline;
            } else {
                this.templatesField[language].inline = parsed.embed.dynamicFields.inline;
            }
        }
        if (!parsed.embed.dynamicFields__comment__ ||
            typeof parsed.embed.dynamicFields__comment__ !== "string") {
            Object.defineProperty(parsed.embed, "dynamicFields__comment__", { enumerable: false, writable: true });
            parsed.embed.dynamicFields__comment__ = this.fieldDescription;
        }
        return [parsed, comment];
    }

    public format<F extends Record<string, string>>(
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

    public formatEmbed<F extends Record<string, string>>(
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
                    embed.addFields({
                        name: format(template.name, formattedFieldThing),
                        value: format(template.value, formattedFieldThing), inline: template.inline
                    });
                } else {
                    embed.addFields({ name: "", value: "" });
                }
            }
        }
        return embed;
    }
}

/**
 * An array of template placeholder replacements.
 * @category Language
 */
export type TemplateStuffs<T extends Record<string, string>, U extends Record<string, string>>
    = Array<TemplateStuff<T, U> | undefined>;

/**
 * Localized version of an embed field.
 * @category Language
 */
export interface ILocalizedEmbedField {
    [key: string]: IEmbedField;
}
