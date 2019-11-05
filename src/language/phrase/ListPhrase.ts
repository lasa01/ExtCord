import { DEFAULT_LANGUAGE } from "../Languages";
import { IPhraseInfo, Phrase } from "./Phrase";

export class ListPhrase extends Phrase {
    protected defaults: IListMap;
    protected templates: IListMap;

    constructor(info: IPhraseInfo, defaults?: IListMap | string[]) {
        super(info);
        if (!defaults) {
            defaults = [];
        }
        if (Array.isArray(defaults)) {
            defaults = {
                [DEFAULT_LANGUAGE]: defaults,
            };
        }
        for (const language of Object.keys(defaults)) {
            if (!this.languages.includes(language)) {
                this.languages.push(language);
            }
        }
        this.defaults = defaults;
        this.templates = defaults;
    }

    public get(language: string) {
        return this.templates[language];
    }

    public parse(language: string, data: any): [string[], string?] {
        if (Array.isArray(data) && data.every((element) => typeof element === "string")) {
            this.templates[language] = data;
            return [data, this.description];
        } else {
            return [this.defaults[language] ?? this.defaults[DEFAULT_LANGUAGE], this.description];
        }
    }
}

export interface IListMap {
    [key: string]: string[];
}
