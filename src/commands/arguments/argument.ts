import { PhraseGroup } from "../../language/phrase/phrasegroup";
import { SimplePhrase } from "../../language/phrase/simplephrase";
import { Command } from "../command";

export abstract class Argument {
    public name: string;
    public localizedName: SimplePhrase;
    public description: string;
    public localizedDescription: SimplePhrase;
    public optional: boolean;
    public allowCombining: boolean;
    private phraseGroup: PhraseGroup;

    constructor(info: IArgumentInfo, optional = false, allowCombining = false) {
        this.name = info.name;
        this.localizedName = new SimplePhrase({
            name: "name",
        }, this.name);
        this.description = info.description;
        this.localizedDescription = new SimplePhrase({
            name: "description",
        }, this.name);
        this.phraseGroup = new PhraseGroup({
            name: this.name,
        }, [ this.localizedDescription, this.localizedName ]);
        this.allowCombining = allowCombining;
        this.optional = optional;
    }

    public register(command: Command) {
        command.registerArgPhrase(this.phraseGroup);
    }

    public abstract check(data: string): boolean;

    public abstract parse(data: string): any;
}

export interface IArgumentInfo {
    name: string;
    description: string;
}
