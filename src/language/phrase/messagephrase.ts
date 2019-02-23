import { IPhraseInfo, Phrase } from "./phrase";

export class MessagePhrase extends Phrase {
    protected defaultsText: { [key: string]: string };
    protected defaultsEmbed: { [key: string]: {
        title?: string,
        description?: string;
        footer?: string;
        author?: string;
        fields: Array<{
            name?: string;
            value?: string;
        }>;
    }};
    constructor(info: IPhraseInfo, defaultsText: { [key: string]: string } | string, defaultsEmbed: { [key: string]: {
        title?: string,
        description?: string;
        footer?: string;
        author?: string;
        fields: Array<{
            name?: string;
            value?: string;
        }>;
    }} | {
        title?: string,
        description?: string;
        footer?: string;
        author?: string;
        fields: Array<{
            name?: string;
            value?: string;
        }>;
    }) {
        super(info);
        if (typeof defaultsText === "string") {
            defaultsText = {
                // TODO get default language
                en: defaultsText,
            };
        }
        if (Array.isArray(defaultsEmbed.fields)) {
            defaultsEmbed = {
                // TODO get default language
                en: defaultsEmbed as {
                    title?: string,
                    description?: string;
                    footer?: string;
                    author?: string;
                    fields: Array<{
                        name?: string;
                        value?: string;
                    }>;
                },
            };
        }
        this.defaultsText = defaultsText;
        this.defaultsEmbed = defaultsEmbed as { [key: string]: {
            title?: string,
            description?: string;
            footer?: string;
            author?: string;
            fields: Array<{
                name?: string;
                value?: string;
            }>;
        }};
    }

    public parse(language: string, data: any): [any, string?] {
        throw new Error("Method not implemented.");
    }

}
