import { PhraseGroup } from "../../language/phrase/phrasegroup";
import { SimplePhrase } from "../../language/phrase/simplephrase";
import { Command, LinkedErrorResponse } from "../command";
import { ICommandContext } from "../commands";

export abstract class Argument<T, U extends boolean> {
    public name: string;
    public localizedName: SimplePhrase;
    public description: string;
    public localizedDescription: SimplePhrase;
    public optional: U;
    public allowCombining: boolean;
    private phraseGroup: PhraseGroup;
    private registered: boolean;

    constructor(info: IArgumentInfo, optional: U, allowCombining = false) {
        this.name = info.name;
        this.localizedName = new SimplePhrase({
            name: "name",
        }, this.name);
        this.description = info.description;
        this.localizedDescription = new SimplePhrase({
            name: "description",
        }, this.description);
        this.phraseGroup = new PhraseGroup({
            name: this.name,
        }, [ this.localizedDescription, this.localizedName ]);
        this.allowCombining = allowCombining;
        this.optional = optional;
        this.registered = false;
    }

    public register(command: Command<any>) {
        if (!this.registered) {
            command.registerArgPhrase(this.phraseGroup);
            this.registered = true;
        }
    }

    public getPhrase() {
        return this.phraseGroup;
    }

    public abstract async check(data: string, context: ICommandContext, error: LinkedErrorResponse): Promise<boolean>;

    public abstract parse(data: string, context: ICommandContext): T;
}

export interface IArgumentInfo {
    name: string;
    description: string;
}
