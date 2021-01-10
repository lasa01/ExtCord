import { DEFAULT_LANGUAGE } from "../../language/Languages";
import { PhraseGroup } from "../../language/phrase/PhraseGroup";
import { SimplePhrase } from "../../language/phrase/SimplePhrase";
import { Command, ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";

/**
 * A generic abstract base class for all command arguments.
 * @category Command Argument
 * @typeparam T The type of the parsed argument returned from [[parse]].
 * @typeparam U A boolean representing whether the argument is optional.
 * @typeparam V The type of the data passed from [[check]] to [[parse]].
 */
export abstract class Argument<T, U extends boolean, V> {
    /** The name the argument is registered by internally. */
    public name: string;
    /** The localized, user-friendly name of the argument. */
    public localizedName: SimplePhrase;
    /** The description in default language. */
    public description: string;
    /** The localized, user-friendly description of the argument. */
    public localizedDescription: SimplePhrase;
    /** A boolean representing whether the argument can be omitted. */
    public optional: U;
    /** A boolean representing whether the argument can contain spaces. */
    public allowCombining: boolean;
    private phraseGroup: PhraseGroup;
    private registered: boolean;
    private usageCache: Map<string, string>;

    /**
     * Creates a new argument, usually passed to a [[Command]] constructor.
     * @param info Defines argument parameters common to all argument types.
     * @param optional Allows the argument to be omitted.
     * @param allowCombining Allows the argument to contain spaces.
     */
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

    /**
     * Registers the argument to the given command.
     * @param command The command to register the argument to.
     */
    public registerSelf(command: Command<any>) {
        if (!this.registered) {
            command.addArgPhrases(this.phraseGroup);
            this.registered = true;
        }
    }

    /** Gets the phrase group of the argument for registration purposes. */
    public getPhrase() {
        return this.phraseGroup;
    }

    /**
     * Gets the localized name with usage hints for the given language.
     * @param language The language to get the name for.
     */
    public getUsageName(language: string): string {
        const name = this.localizedName.get(language);
        return this.optional ? `(${name})` : `[${name}]`;
    }

    /**
     * Gets the argument usage string for the given language.
     * @param language The language to get the usage string for.
     */
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

    /**
     * Checks the argument for errors, and passes the returned data to [[parse]].
     * @param data The raw passed argument string, trimmed of whitespace.
     * @param context The context associated with the command being called.
     * @param error A function to call and return when the argument is invalid.
     */
    public abstract check(data: string, context: ICommandContext, error: ILinkedErrorResponse):
        Promise<V|undefined>;

    /**
     * Parses the argument and returns the result. Can use passed data from [[check]].
     * @param data The raw passed argument string, trimmed of whitespace.
     * @param context The context associated with the command being called.
     * @param passed The passed data from [[check]].
     */
    public abstract parse(data: string, context: ICommandContext, passed: V): T;
}

/**
 * Defines argument parameters common to all arguments.
 * @category Command Argument
 */
export interface IArgumentInfo {
    /**
     * Name of the argument.
     * Can be either a string, in which case it is assumed to be in [[DEFAULT_LANGUAGE]],
     * or an object, in which case the keys are languages and the values are associated localized names.
     */
    name: string | Record<string, string>;
    /**
     * Description of the argument.
     * Can be either a string, in which case it is assumed to be in [[DEFAULT_LANGUAGE]],
     * or an object, in which case the keys are languages and the values are associated localized descriptions.
     */
    description: string | Record<string, string>;
}
