import { MessageEmbed } from "discord.js";
import format = require("string-format");

import { DEFAULT_LANGUAGE } from "../Languages";
import { IPhraseInfo } from "./Phrase";
import { SimplePhrase } from "./SimplePhrase";
import { TemplatePhrase, TemplateStuff } from "./TemplatePhrase";

/**
 * A phrase handling the translations of a message template.
 * @category Language
 */
export class MessagePhrase<T extends Record<string, string>> extends TemplatePhrase<T> {
    protected defaultsEmbed: ILocalizedBaseEmbed;
    protected templatesEmbed: ILocalizedBaseEmbed;

    /**
     * Creates a new message phrase.
     * @param info Defines basic phrase parameters.
     * @param defaultsText Defines default translations for the text-only version of the message.
     * @param defaultsEmbed Defines default translations for the embed version of the message.
     * @param templateDescription Descriptions of available placeholders. Keys are placeholders and values descriptions.
     */
    constructor(
            info: IPhraseInfo,
            defaultsText: Record<string, string> | string, defaultsEmbed: ILocalizedBaseEmbed | IBaseEmbed,
            templateDescription: T,
        ) {
        super(info, defaultsText, templateDescription);
        if (typeof defaultsEmbed.timestamp === "boolean") {
            defaultsEmbed = {
                [DEFAULT_LANGUAGE]: defaultsEmbed as IBaseEmbed,
            };
        }
        this.defaultsEmbed = defaultsEmbed as ILocalizedBaseEmbed;
        this.templatesEmbed = this.defaultsEmbed;
    }

    public parse(language: string, data: any): [any, string?] {
        if (typeof data !== "object") {
            return [{
                embed: this.defaultsEmbed[language] ?? this.defaultsEmbed[DEFAULT_LANGUAGE],
                text: this.defaults[language] ?? this.defaults[DEFAULT_LANGUAGE],
            }, this.description];
        }
        if (typeof data.text !== "string") {
            data.text = this.defaults[language] ?? this.defaults[DEFAULT_LANGUAGE];
        } else {
            this.templates[language] = data.text;
        }
        if (!this.templatesEmbed[language]) {
            this.templatesEmbed[language] = {
                timestamp: false,
            };
        }
        if (typeof data.embed !== "object") {
            data.embed = this.defaultsEmbed[language] ?? this.defaultsEmbed[DEFAULT_LANGUAGE];
        } else {
            if (data.embed.title && typeof data.embed.title !== "string") {
                data.embed.title = this.defaultsEmbed[language].title ?? this.defaultsEmbed[DEFAULT_LANGUAGE].title;
            } else {
                this.templatesEmbed[language].title = data.embed.title;
            }
            if (data.embed.url && typeof data.embed.url !== "string") {
                data.embed.url = this.defaultsEmbed[language].url ?? this.defaultsEmbed[DEFAULT_LANGUAGE].url;
            } else {
                this.templatesEmbed[language].url = data.embed.url;
            }
            if (data.embed.author && typeof data.embed.author !== "object") {
                data.embed.author = this.defaultsEmbed[language].author ?? this.defaultsEmbed[DEFAULT_LANGUAGE].author;
            } else if (data.embed.author) {
                if (this.templatesEmbed[language].author === undefined) {
                    this.templatesEmbed[language].author = {
                        name: "",
                    };
                }
                if (typeof data.embed.author.name !== "string") {
                    data.embed.author.name = this.defaultsEmbed[language].author?.name ??
                        this.defaultsEmbed[DEFAULT_LANGUAGE].author?.name;
                } else {
                    this.templatesEmbed[language].author!.name = data.embed.author.name;
                }
                if (data.embed.author.iconUrl && typeof data.embed.author.iconUrl !== "string") {
                    data.embed.author.iconUrl = this.defaultsEmbed[language].author?.iconUrl ??
                        this.defaultsEmbed[DEFAULT_LANGUAGE].author?.iconUrl;
                } else {
                    this.templatesEmbed[language].author!.iconUrl = data.embed.author.iconUrl;
                }
                if (data.embed.author.url && typeof data.embed.author.url !== "string") {
                    data.embed.author.url = this.defaultsEmbed[language].author?.url ??
                        this.defaultsEmbed[DEFAULT_LANGUAGE].author?.url;
                } else {
                    this.templatesEmbed[language].author!.url = data.embed.author.url;
                }
            } else {
                this.templatesEmbed[language].author = undefined;
            }
            if (data.embed.description && typeof data.embed.description !== "string") {
                data.embed.description =
                    this.defaultsEmbed[language].description ?? this.defaultsEmbed[DEFAULT_LANGUAGE].description;
            } else {
                this.templatesEmbed[language].description = data.embed.description;
            }
            if (data.embed.fields && !Array.isArray(data.embed.fields)) {
                data.embed.fields = this.defaultsEmbed[language].fields ?? this.defaultsEmbed[DEFAULT_LANGUAGE].fields;
            } else if (data.embed.fields) {
                if (!this.templatesEmbed[language].fields) {
                    this.templatesEmbed[language].fields = [];
                }
                for (const [index, field] of data.embed.fields.entries()) {
                    if (!this.templatesEmbed[language].fields![index]) {
                        this.templatesEmbed[language].fields![index] = {
                            inline: false,
                            name: "",
                            value: "",
                        };
                    }
                    if (typeof field.name !== "string") {
                        field.name =
                            (this.defaultsEmbed[language].fields && this.defaultsEmbed[language].fields![index]) ?
                                this.defaultsEmbed[language].fields![index].name :
                                (this.defaultsEmbed[DEFAULT_LANGUAGE].fields &&
                                    this.defaultsEmbed[DEFAULT_LANGUAGE].fields![index]) ?
                                this.defaultsEmbed[DEFAULT_LANGUAGE].fields![index].name : "";
                    } else {
                        this.templatesEmbed[language].fields![index].name = field.name;
                    }
                    if (typeof field.value !== "string") {
                        field.value =
                            (this.defaultsEmbed[language].fields && this.defaultsEmbed[language].fields![index]) ?
                                this.defaultsEmbed[language].fields![index].value :
                                (this.defaultsEmbed[DEFAULT_LANGUAGE].fields &&
                                    this.defaultsEmbed[DEFAULT_LANGUAGE].fields![index]) ?
                                this.defaultsEmbed[DEFAULT_LANGUAGE].fields![index].value : "";
                    } else {
                        this.templatesEmbed[language].fields![index].value = field.value;
                    }
                    if (typeof field.inline !== "boolean") {
                        field.inline =
                            (this.defaultsEmbed[language].fields && this.defaultsEmbed[language].fields![index]) ?
                                this.defaultsEmbed[language].fields![index].inline :
                                (this.defaultsEmbed[DEFAULT_LANGUAGE].fields &&
                                    this.defaultsEmbed[DEFAULT_LANGUAGE].fields![index]) ?
                                this.defaultsEmbed[DEFAULT_LANGUAGE].fields![index].inline : false;
                    } else {
                        this.templatesEmbed[language].fields![index].inline = field.inline;
                    }
                }
            } else {
                this.templatesEmbed[language].fields = undefined;
            }
            if (data.embed.thumbnailUrl && typeof data.embed.thumbnailUrl !== "string") {
                data.embed.thumbnailUrl =
                    this.defaultsEmbed[language].thumbnailUrl ?? this.defaultsEmbed[DEFAULT_LANGUAGE].thumbnailUrl;
            } else {
                this.templatesEmbed[language].thumbnailUrl = data.embed.thumbnailUrl;
            }
            if (data.embed.imageUrl && typeof data.embed.imageUrl !== "string") {
                data.embed.imageUrl =
                    this.defaultsEmbed[language].imageUrl ?? this.defaultsEmbed[DEFAULT_LANGUAGE].imageUrl;
            } else {
                this.templatesEmbed[language].imageUrl = data.embed.imageUrl;
            }
            if (data.embed.timestamp && typeof data.embed.timestamp !== "boolean") {
                data.embed.timestamp =
                    this.defaultsEmbed[language].timestamp ?? this.defaultsEmbed[DEFAULT_LANGUAGE].timestamp;
            } else {
                this.templatesEmbed[language].timestamp = data.embed.timestamp;
            }
            if (data.embed.footer && typeof data.embed.footer !== "object") {
                data.embed.footer = this.defaultsEmbed[language].footer ?? this.defaultsEmbed[DEFAULT_LANGUAGE].footer;
            } else if (data.embed.footer) {
                if (!this.templatesEmbed[language].footer) {
                    this.templatesEmbed[language].footer = {};
                }
                if (data.embed.footer.text && typeof data.embed.footer.text !== "string") {
                    data.embed.footer.text = this.defaultsEmbed[language].footer?.text ??
                        this.defaultsEmbed[DEFAULT_LANGUAGE].footer?.text;
                } else {
                    this.templatesEmbed[language].footer!.text = data.embed.footer.text;
                }
                if (data.embed.footer.iconUrl && typeof data.embed.footer.iconUrl !== "string") {
                    data.embed.footer.iconUrl = this.defaultsEmbed[language].footer?.iconUrl ??
                        this.defaultsEmbed[DEFAULT_LANGUAGE].footer?.iconUrl;
                } else {
                    this.templatesEmbed[language].footer!.iconUrl = data.embed.footer.iconUrl;
                }
            } else {
                this.templatesEmbed[language].footer = undefined;
            }
        }

        return [data, this.description];
    }

    /**
     * Formats the translated message for the specified language with the supplied placeholder replacements.
     * @param language The language to use.
     * @param stuff The placeholder replacements to use.
     */
    public formatEmbed<U extends Record<string, string>>(language: string, stuff?: TemplateStuff<T, U>): MessageEmbed {
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
        const embed = this.defaultsEmbed[language];
        let fields: IEmbedField[] | undefined;
        if (embed.fields) {
            fields = [];
            for (const field of embed.fields) {
                fields.push({
                    inline: field.inline,
                    name: format(field.name, processedStuff),
                    value: format(field.value, processedStuff),
                });
            }
        }
        return new MessageEmbed({
            author: embed.author ? {
                icon_url: embed.author.iconUrl ? format(embed.author.iconUrl, processedStuff) : undefined,
                name: format(embed.author.name, processedStuff),
                url: embed.author.url ? format(embed.author.url, processedStuff) : undefined,
            } : undefined,
            description: embed.description ? format(embed.description, processedStuff) : undefined,
            fields,
            footer: embed.footer ? {
                icon_url: embed.footer.iconUrl ? format(embed.footer.iconUrl, processedStuff) : undefined,
                text: embed.footer.text ? format(embed.footer.text, processedStuff) : undefined,
            } : undefined,
            image: embed.imageUrl ? { url: format(embed.imageUrl, processedStuff) } : undefined,
            thumbnail: embed.thumbnailUrl ? { url: format(embed.thumbnailUrl, processedStuff) } : undefined,
            timestamp: embed.timestamp ? new Date() : undefined,
            title: embed.title ? format(embed.title, processedStuff) : undefined,
            url: embed.url ? format(embed.url, processedStuff) : undefined,
        });
    }
}

/**
 * Defines a single embed field.
 * @category Language
 */
export interface IEmbedField {
    /** The name of the field. */
    name: string;
    /** The value of the field. */
    value: string;
    /** Allows the field to be inlined with other fields. */
    inline: boolean;
}

/**
 * Defines an embed.
 * @category Language
 */
export interface IBaseEmbed {
    /** The title of the embed. */
    title?: string;
    /** The url the title links to. */
    url?: string;
    /** The author information. */
    author?: {
        name: string;
        iconUrl?: string;
        url?: string;
    };
    /** The description of the embed. */
    description?: string;
    /** Fields of the embed. */
    fields?: IEmbedField[];
    /** The url to the thumbnail image. */
    thumbnailUrl?: string;
    /** The url to the embed image. */
    imageUrl?: string;
    /** Whether to include the current time in the embed. */
    timestamp: boolean;
    /** The footer of the embed. */
    footer?: {
        text?: string;
        iconUrl?: string;
    };
}

/**
 * Localized version of an embed.
 * @category Language
 */
export interface ILocalizedBaseEmbed {
    [key: string]: IBaseEmbed;
}
