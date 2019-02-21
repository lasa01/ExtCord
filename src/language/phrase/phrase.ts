import Util from "util";
import BasePhrase, { IPhraseInfo } from "./basephrase";

export default class Phrase extends BasePhrase {
    private defaults: { [key: string]: string };
    private templates: { [key: string]: string };

    constructor(info: IPhraseInfo, defaults: { [key: string]: string }) {
        super(info);
        this.defaults = defaults;
        this.templates = defaults;
    }

    public setTemplate(language: string, template: string) {
        this.templates[language] = template;
    }

    public format(language: string, stuff: Array<string|number>) {
        return Util.format(this.templates[language], ...stuff);
    }

    public parse(language: string, data: any): [string, string] {
        if (typeof data === "string") {
            this.templates[language] = data;
            return [data, this.description];
        } else  {
            return [this.defaults[language] || "", this.description];
        }
    }
}
