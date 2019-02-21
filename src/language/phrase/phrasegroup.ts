import BasePhrase, { IPhraseInfo } from "./basephrase";

export default class PhraseGroup extends BasePhrase {
    public phrases: Map<string, BasePhrase>;

    constructor(info: IPhraseInfo, phrases: BasePhrase[]) {
        super(info);
        this.phrases = new Map();
        for (const phrase of phrases) {
            this.phrases.set(phrase.name, phrase);
        }
    }

    public parse(language: string, data: any): [object, string] {
        if (typeof data !== "object") {
            data = {};
        }
        for (const [name, phrase] of this.phrases) {
            const [parsed, comment] = phrase.parse(language, data[name]);
            data[name] = parsed;
            if (!data[name + "__commentBefore__"]) {
                data[name + "__commentBefore__"] = comment;
            }
        }
        return [data, this.description];
    }
}
