import format = require("string-format");

import { DEFAULT_LANGUAGE } from "../languages";
import { IPhraseInfo } from "./phrase";
import { TemplatePhrase } from "./templatephrase";

import { RichEmbed } from "discord.js";
import { SimplePhrase } from "./simplephrase";

export class MessagePhrase<T extends { [key: string]: string }> extends TemplatePhrase<T> {
    protected defaultsEmbed: ILocalizedBaseEmbed;
    protected templatesEmbed: ILocalizedBaseEmbed;
    constructor(info: IPhraseInfo, defaultsText: { [key: string]: string } | string,
                defaultsEmbed: ILocalizedBaseEmbed | IBaseEmbed, templateDescription: T ) {
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
                embed: this.defaultsEmbed[language],
                text: this.defaults[language],
            }, this.description];
        }
        if (typeof data.text !== "string") {
            data.text = this.defaults[language];
        } else {
            this.templates[language] = data.text;
        }
        if (!this.templatesEmbed[language]) {
            this.templatesEmbed[language] = {
                timestamp: false,
            };
        }
        if (typeof data.embed !== "object") {
            data.embed = this.defaultsEmbed[language];
        } else {
            if (data.embed.title && typeof data.embed.title !== "string") {
                data.embed.title = this.defaultsEmbed[language].title;
            } else {
                this.templatesEmbed[language].title = data.embed.title;
            }
            if (data.embed.url && typeof data.embed.url !== "string") {
                data.embed.url = this.defaultsEmbed[language].url;
            } else {
                this.templatesEmbed[language].url = data.embed.url;
            }
            if (data.embed.author && typeof data.embed.author !== "object") {
                data.embed.author = this.defaultsEmbed[language].author;
            } else if (data.embed.author) {
                if (!this.templatesEmbed[language].author) {
                    this.templatesEmbed[language].author = {
                        name: "",
                    };
                }
                if (typeof data.embed.author.name !== "string") {
                    data.embed.author.name = this.defaultsEmbed[language].author ?
                        this.defaultsEmbed[language].author!.name : undefined;
                } else {
                    this.templatesEmbed[language].author!.name = data.embed.author.name;
                }
                if (data.embed.author.iconUrl && typeof data.embed.author.iconUrl !== "string") {
                    data.embed.author.iconUrl = this.defaultsEmbed[language].author ?
                        this.defaultsEmbed[language].author!.iconUrl : undefined;
                } else {
                    this.templatesEmbed[language].author!.iconUrl = data.embed.author.iconUrl;
                }
                if (data.embed.author.url && typeof data.embed.author.url !== "string") {
                    data.embed.author.url = this.defaultsEmbed[language].author ?
                        this.defaultsEmbed[language].author!.url : undefined;
                } else {
                    this.templatesEmbed[language].author!.url = data.embed.author.url;
                }
            } else {
                this.templatesEmbed[language].author = undefined;
            }
            if (data.embed.description && typeof data.embed.description !== "string") {
                data.embed.description = this.defaultsEmbed[language].description;
            } else {
                this.templatesEmbed[language].description = data.embed.description;
            }
            if (data.embed.fields && !Array.isArray(data.embed.fields)) {
                data.embed.fields = this.defaultsEmbed[language].fields;
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
                            this.defaultsEmbed[language].fields![index].name : "";
                    } else {
                        this.templatesEmbed[language].fields![index].name = field.name;
                    }
                    if (typeof field.value !== "string") {
                        field.value =
                            (this.defaultsEmbed[language].fields && this.defaultsEmbed[language].fields![index]) ?
                            this.defaultsEmbed[language].fields![index].value : "";
                    } else {
                        this.templatesEmbed[language].fields![index].value = field.value;
                    }
                    if (typeof field.inline !== "boolean") {
                        field.inline =
                            (this.defaultsEmbed[language].fields && this.defaultsEmbed[language].fields![index]) ?
                            this.defaultsEmbed[language].fields![index].inline : false;
                    } else {
                        this.templatesEmbed[language].fields![index].inline = field.inline;
                    }
                }
            } else {
                this.templatesEmbed[language].fields = undefined;
            }
            if (data.embed.thumbnailUrl && typeof data.embed.thumbnailUrl !== "string") {
                data.embed.thumbnailUrl = this.defaultsEmbed[language].thumbnailUrl;
            } else {
                this.templatesEmbed[language].thumbnailUrl = data.embed.thumbnailUrl;
            }
            if (data.embed.imageUrl && typeof data.embed.imageUrl !== "string") {
                data.embed.imageUrl = this.defaultsEmbed[language].imageUrl;
            } else {
                this.templatesEmbed[language].imageUrl = data.embed.imageUrl;
            }
            if (data.embed.timestamp && typeof data.embed.timestamp !== "boolean") {
                data.embed.timestamp = this.defaultsEmbed[language].timestamp;
            } else {
                this.templatesEmbed[language].timestamp = data.embed.timestamp;
            }
            if (data.embed.footer && typeof data.embed.footer !== "object") {
                data.embed.footer = this.defaultsEmbed[language].footer;
            } else if (data.embed.footer) {
                if (!this.templatesEmbed[language].footer) {
                    this.templatesEmbed[language].footer = {};
                }
                if (data.embed.footer.text && typeof data.embed.footer.text !== "string") {
                    data.embed.footer.text = this.defaultsEmbed[language].footer ?
                        this.defaultsEmbed[language].footer!.text : undefined;
                } else {
                    this.templatesEmbed[language].footer!.text = data.embed.footer.text;
                }
                if (data.embed.footer.iconUrl && typeof data.embed.footer.iconUrl !== "string") {
                    data.embed.footer.iconUrl = this.defaultsEmbed[language].footer ?
                        this.defaultsEmbed[language].footer!.iconUrl : undefined;
                } else {
                    this.templatesEmbed[language].footer!.iconUrl = data.embed.footer.iconUrl;
                }
            } else {
                this.templatesEmbed[language].footer = undefined;
            }
        }

        return [data, this.description];
    }

    public formatEmbed(language: string, stuff?: { [P in keyof T]: T[P]|SimplePhrase|TemplatePhrase<T> }): RichEmbed {
        if (stuff) {
            for (const [key, thing] of Object.entries(stuff)) {
                if (thing instanceof SimplePhrase && thing !== this) {
                    stuff[key as keyof T] = thing instanceof TemplatePhrase ?
                    thing.format(language, stuff)  as T[keyof T] :
                    thing.get(language) as T[keyof T];
                }
            }
        }
        const stuffOrEmpty = stuff || {};
        const embed = this.defaultsEmbed[language];
        let fields: IEmbedField[] | undefined;
        if (embed.fields) {
            fields = [];
            for (const field of embed.fields) {
                fields.push({
                    inline: field.inline,
                    name: format(field.name, stuffOrEmpty),
                    value: format(field.value, stuffOrEmpty),
                });
            }
        }
        return new RichEmbed({
            author: embed.author ? {
                icon_url: embed.author.iconUrl ? format(embed.author.iconUrl, stuffOrEmpty) : undefined,
                name: format(embed.author.name, stuffOrEmpty),
                url: embed.author.url ? format(embed.author.url, stuffOrEmpty) : undefined,
            } : undefined,
            description: embed.description ? format(embed.description, stuffOrEmpty) : undefined,
            fields,
            footer: embed.footer ? {
                icon_url: embed.footer.iconUrl ? format(embed.footer.iconUrl, stuffOrEmpty) : undefined,
                text: embed.footer.text ? format(embed.footer.text, stuffOrEmpty) : undefined,
            } : undefined,
            image: embed.imageUrl ? { url: format(embed.imageUrl, stuffOrEmpty) } : undefined,
            thumbnail: embed.thumbnailUrl ? { url: format(embed.thumbnailUrl, stuffOrEmpty) } : undefined,
            timestamp: embed.timestamp ? new Date() : undefined,
            title: embed.title ? format(embed.title, stuffOrEmpty) : undefined,
            url: embed.url ? format(embed.url, stuffOrEmpty) : undefined,
        });
    }
}

export interface IEmbedField {
    name: string;
    value: string;
    inline: boolean;
}

export interface IBaseEmbed {
    title?: string;
    url?: string;
    author?: {
        name: string;
        iconUrl?: string;
        url?: string;
    };
    description?: string;
    fields?: IEmbedField[];
    thumbnailUrl?: string;
    imageUrl?: string;
    timestamp: boolean;
    footer?: {
        text?: string;
        iconUrl?: string;
    };
}

export interface ILocalizedBaseEmbed {
    [key: string]: IBaseEmbed;
}
