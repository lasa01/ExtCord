import { DEFAULT_LANGUAGE } from "../../language/Languages";
import { PhraseGroup } from "../../language/phrase/PhraseGroup";
import { SimplePhrase } from "../../language/phrase/SimplePhrase";
import { Command, ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";

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
        this.name = typeof info.name === "string" ? info.name : info.name[DEFAULT_LANGUAGE];
        this.localizedName = new SimplePhrase({
            name: "name",
        }, info.name);
        this.description = typeof info.description === "string" ? info.description : info.description[DEFAULT_LANGUAGE];
        this.localizedDescription = new SimplePhrase({
            name: "description",
        }, info.description);
        this.phraseGroup = new PhraseGroup({
            name: this.name,
        }, [ this.localizedDescription, this.localizedName ]);
        this.allowCombining = allowCombining;
        this.optional = optional;
        this.registered = false;
        this.usageCache = new Map();
    }

    public registerSelf(command: Command<any>) {
        if (!this.registered) {
            command.addArgPhrases(this.phraseGroup);
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
    name: string | Record<string, string>;
    description: string | Record<string, string>;
}
