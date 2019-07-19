import { PhraseGroup } from "../../language/phrase/phrasegroup";
import { SimplePhrase } from "../../language/phrase/simplephrase";
import { Command, ILinkedErrorResponse } from "../command";
import { CommandPhrases } from "../commandphrases";
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
    private usageCache: Map<string, string>;

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
        this.usageCache = new Map();
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

    public getUsageName(language: string): string {
        const name = this.localizedName.get(language);
        return this.optional ? `(${name})` : `[${name}]`;
    }

    public getUsage(language: string): string {
        if (this.usageCache.has(language)) {
            return this.usageCache.get(language)!;
        }
        const usage = CommandPhrases.argumentUsage.format(language, {
            argument: this.getUsageName(language),
            description: this.localizedDescription,
        });
        this.usageCache.set(language, usage);
        return usage;
    }

    public abstract async check(data: string, context: ICommandContext, error: ILinkedErrorResponse): Promise<boolean>;

    public abstract parse(data: string, context: ICommandContext): T;
}

export interface IArgumentInfo {
    name: string;
    description: string;
}
