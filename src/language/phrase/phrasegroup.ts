import { IPhraseInfo, Phrase } from "./phrase";

export class PhraseGroup extends Phrase {
    public phrases: Map<string, Phrase>;

    constructor(info: IPhraseInfo, phrases: Phrase[]) {
        super(info);
        this.phrases = new Map();
        for (const phrase of phrases) {
            this.phrases.set(phrase.name, phrase);
        }
    }

    public parse(language: string, data: any): [object, string?] {
        if (typeof data !== "object") {
            data = {};
        }
        for (const [name, phrase] of this.phrases) {
            const [parsed, comment] = phrase.parse(language, data[name]);
            data[name] = parsed;
            if (!data[name + "__commentBefore__"]) {
                Object.defineProperty(data, name + "__commentBefore__", { enumerable: false, writable: true});
                data[name + "__commentBefore__"] = comment;
            }
        }
        return [data, this.description];
    }
}