import { DEFAULT_LANGUAGE } from "../Languages";
import { IPhraseInfo, Phrase } from "./Phrase";

export class SimplePhrase extends Phrase {
    protected templates: ISimpleMap;
    protected defaults: ISimpleMap;

    constructor(info: IPhraseInfo, defaults: ISimpleMap | string) {
        super(info);
        if (typeof defaults === "string") {
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

    public parse(language: string, data: object): [string, string?] {
        if (typeof data === "string") {
            this.templates[language] = data;
            return [data, this.description];
        } else  {
            return [this.defaults[language] || this.defaults[DEFAULT_LANGUAGE], this.description];
        }
    }
}

export interface ISimpleMap { [key: string]: string; }
