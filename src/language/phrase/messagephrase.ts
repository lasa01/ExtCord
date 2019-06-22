import format = require("string-format");

import { IPhraseInfo } from "./phrase";
import { TemplatePhrase } from "./templatephrase";

import { RichEmbed } from "discord.js";

export class MessagePhrase<T extends { [key: string]: string }> extends TemplatePhrase<T> {
    protected defaultsEmbed: ILocalizedBaseEmbed;
    protected templatesEmbed: ILocalizedBaseEmbed;
    constructor(info: IPhraseInfo, defaultsText: { [key: string]: string } | string,
                defaultsEmbed: ILocalizedBaseEmbed | IBaseEmbed, templateDescription: T ) {
        super(info, defaultsText, templateDescription);
        if (typeof defaultsEmbed.timestamp === "boolean") {
            defaultsEmbed = {
                // TODO get default language
                en: defaultsEmbed as IBaseEmbed,
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
        let valid = true;
        if (typeof data.text !== "string") {
            valid = false;
        } else {
            this.templates[language] = data.text;
        }
        if (!this.templatesEmbed[language]) {
            this.templatesEmbed[language] = {
                timestamp: false,
            };
        }
        if (typeof data.embed !== "object") {
            valid = false;
        } else {
            if (data.embed.title && typeof data.embed.title !== "string") {
                valid = false;
            } else {
                this.templatesEmbed[language].title = data.embed.title;
            }
            if (data.embed.url && typeof data.embed.url !== "string") {
                valid = false;
            } else {
                this.templatesEmbed[language].url = data.embed.url;
            }
            if (data.embed.author && typeof data.embed.author !== "object") {
                valid = false;
            } else if (data.embed.author) {
                if (!this.templatesEmbed[language].author) {
                    this.templatesEmbed[language].author = {
                        name: "",
                    };
                }
                if (typeof data.embed.author.name !== "string") {
                    valid = false;
                } else {
                    this.templatesEmbed[language].author!.name = data.embed.author.name;
                }
                if (data.embed.author.iconUrl && typeof data.embed.author.iconUrl !== "string") {
                    valid = false;
                } else {
                    this.templatesEmbed[language].author!.iconUrl = data.embed.author.iconUrl;
                }
                if (data.embed.author.url && typeof data.embed.author.url !== "string") {
                    valid = false;
                } else {
                    this.templatesEmbed[language].author!.url = data.embed.author.url;
                }
            } else {
                this.templatesEmbed[language].author = undefined;
            }
            if (data.embed.description && typeof data.embed.description !== "string") {
                valid = false;
            } else {
                this.templatesEmbed[language].description = data.embed.description;
            }
            if (data.embed.thumbnailUrl && typeof data.embed.thumbnailUrl !== "string") {
                valid = false;
            } else {
                this.templatesEmbed[language].thumbnailUrl = data.embed.thumbnailUrl;
            }
            if (data.embed.imageUrl && typeof data.embed.imageUrl !== "string") {
                valid = false;
            } else {
                this.templatesEmbed[language].imageUrl = data.embed.imageUrl;
            }
            if (data.embed.timestamp && typeof data.embed.timestamp !== "boolean") {
                valid = false;
            } else {
                this.templatesEmbed[language].timestamp = data.embed.timestamp;
            }
            if (data.embed.footer && typeof data.embed.footer !== "object") {
                valid = false;
            } else if (data.embed.footer) {
                if (!this.templatesEmbed[language].footer) {
                    this.templatesEmbed[language].footer = {};
                }
                if (data.embed.footer.text && typeof data.embed.footer.text !== "string") {
                    valid = false;
                } else {
                    this.templatesEmbed[language].footer!.text = data.embed.footer.text;
                }
                if (data.embed.footer.iconUrl && typeof data.embed.footer.iconUrl !== "string") {
                    valid = false;
                } else {
                    this.templatesEmbed[language].footer!.iconUrl = data.embed.footer.iconUrl;
                }
            } else {
                this.templatesEmbed[language].footer = undefined;
            }
        }

        if (valid) {
            return [data, this.description];
        } else {
            return [{
                embed: this.defaultsEmbed[language],
                text: this.defaults[language],
            }, this.description];
        }
    }

    public formatEmbed(language: string, stuff?: T): RichEmbed {
        const stuffOrEmpty = stuff || {};
        const embed = this.defaultsEmbed[language];
        return new RichEmbed({
            author: embed.author ? {
                icon_url: embed.author.iconUrl ? format(embed.author.iconUrl, stuffOrEmpty) : undefined,
                name: format(embed.author.name, stuffOrEmpty),
                url: embed.author.url ? format(embed.author.url, stuffOrEmpty) : undefined,
            } : undefined,
            description: embed.description ? format(embed.description, stuffOrEmpty) : undefined,
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

interface IBaseEmbed {
    title?: string;
    url?: string;
    author?: {
        name: string;
        iconUrl?: string;
        url?: string;
    };
    description?: string;
    thumbnailUrl?: string;
    imageUrl?: string;
    timestamp: boolean;
    footer?: {
        text?: string;
        iconUrl?: string;
    };
}

interface ILocalizedBaseEmbed {
    [key: string]: IBaseEmbed;
}
