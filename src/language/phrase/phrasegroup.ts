import Phrase, { IPhraseInfo } from "./phrase";

export default class PhraseGroup extends Phrase {
    public phrases: Phrase[];

    constructor(info: IPhraseInfo, phrases: Phrase[]) {
        super(info);
        this.phrases = phrases;
    }
}
