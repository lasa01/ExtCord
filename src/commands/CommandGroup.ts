import { Bot } from "../Bot";
import { DEFAULT_LANGUAGE } from "../language/Languages";
import { Phrase } from "../language/phrase/Phrase";
import { PhraseGroup } from "../language/phrase/PhraseGroup";
import { PermissionGroup } from "../permissions/PermissionGroup";
import { PermissionPrivilege } from "../permissions/PermissionPrivilege";
import { IExtendedGuild } from "../util/Types";
import { BuiltInArguments } from "./arguments/BuiltinArguments";
import { Command, ICommandInfo, IExecutionContext } from "./Command";
import { CommandPhrases } from "./CommandPhrases";
import { ICommandContext } from "./Commands";

/**
 * A parent command that does not do anything by itself but has subcommands.
 * @category Command
 */
export class CommandGroup
    extends Command<[typeof BuiltInArguments.subcommand, typeof BuiltInArguments.subcommandArguments]> {
    /** The subcommands of the command group. */
    public children: Map<string, Command<any>>;
    /** The default subcommand that is called when no subcommand is specified, if any. */
    public defaultSubcommand?: string;
    protected subPhraseGroup: PhraseGroup;
    private languageCommandsMap: Map<string, Map<string, Command<any>>>;
    private guildCommandsMap: Map<string, Map<string, Command<any>>>;

    /**
     * Creates a new command group.
     * @param info Defines basic command parameters.
     * @param defaultSubcommand Defines the name of the default subcommand to call when no subcommand is specified.
     * @param children Defines subcommands for the command group.
     */
    constructor(info: ICommandInfo, defaultSubcommand?: string, children?: ReadonlyArray<Command<any>>) {
        super(info, [ BuiltInArguments.subcommand, BuiltInArguments.subcommandArguments ],
            new PermissionGroup({
                description: `Gives the permission for the command group ${info.name}`,
                name: typeof info.name === "string" ? info.name : info.name[DEFAULT_LANGUAGE],
            }));
        this.children = new Map();
        this.subPhraseGroup = new PhraseGroup({
            name: "subcommands",
        });
        this.phraseGroup.removePhrases(this.argPhraseGroup);
        this.phraseGroup.addPhrases(this.subPhraseGroup);
        this.defaultSubcommand = defaultSubcommand;
        if (children) {
            this.addSubcommands(...children);
        }
        this.languageCommandsMap = new Map();
        this.guildCommandsMap = new Map();
    }

    /**
     * Updates the full name of the command and all subcommands to include the parent's name.
     */
    public updateFullName() {
        super.updateFullName();
        for (const child of this.subcommands()) {
            child.updateFullName();
        }
    }

    /**
     * Registers the command and all subcommands for the specified bot.
     * @param bot The bot to register the command for.
     */
    public registerSelf(bot: Bot) {
        super.registerSelf(bot);
        for (const child of this.subcommands()) {
            child.registerSelf(bot);
        }
        if (this.defaultSubcommand) {
            if (!this.children.has(this.defaultSubcommand)) {
                throw new Error(`The default subcommand ${this.defaultSubcommand} doesn't exist`);
            }
            if (this.children.get(this.defaultSubcommand)!.minArguments !== 0) {
                throw new Error(`The default subcommand has required arguments`);
            }
        }
    }

    /**
     * Gets a map of localized global aliases for the given language.
     * @param language The language to use.
     */
    public getGlobalAliases(language: string): { [key: string]: Command<any> } {
        let aliases = super.getGlobalAliases(language);
        for (const child of this.subcommands()) {
            aliases = Object.assign(aliases, child.getGlobalAliases(language));
        }
        return aliases;
    }

    /**
     * Associate the specified subcommands with the command group.
     * @param subcommands Subcommands to add.
     */
    public addSubcommands(...subcommands: Array<Command<any>>) {
        for (const subcommand of subcommands) {
            if (this.children.has(subcommand.name)) {
                throw new Error(`The subcommand ${subcommand.name} is already registered`);
            }
            this.children.set(subcommand.name, subcommand);
            this.addSubPhrases(subcommand.phraseGroup);
            (this.defaultPermission as PermissionGroup).addPermissions(subcommand.getPermission());
            subcommand.registerParent(this);
        }
    }

    /**
     * Remove the specified associated subcommands from the group.
     * @param subcommands Subcommands to remove.
     */
    public removeSubcommands(...subcommands: Array<Command<any>>) {
        for (const subcommand of subcommands) {
            if (this.children.has(subcommand.name)) {
                this.children.delete(subcommand.name);
                this.removeSubPhrases(subcommand.phraseGroup);
                (this.defaultPermission as PermissionGroup).removePermissions(subcommand.getPermission());
                subcommand.unregisterParent();
            }
        }
    }

    /**
     * Associate phrases with the command's subcommands.
     * @param phrases Phrases to add.
     */
    public addSubPhrases(...phrases: Phrase[]) {
        this.subPhraseGroup.addPhrases(...phrases);
    }

    /**
     * Remove associated phrases from the command's subcommands.
     * @param phrases Phrases to remove.
     */
    public removeSubPhrases(...phrases: Phrase[]) {
        this.subPhraseGroup.removePhrases(...phrases);
    }

    /**
     * Executes the command.
     * This either invokes the specific subcommand or responds with an error if the subcommand isn't found.
     * @param context Context of the execution.
     */
    public async execute(
        context: IExecutionContext<[typeof BuiltInArguments.subcommand, typeof BuiltInArguments.subcommandArguments]>) {
        const subcommand = context.arguments[0] ?? this.defaultSubcommand;
        if (subcommand) {
            const subcommandInstance = this.getCommandInstance(context.message.guild, context.language, subcommand);
            if (!subcommandInstance) {
                await context.respond(CommandPhrases.invalidSubcommand, { subcommand });
                return;
            }
            await subcommandInstance.command({
                ...context,
                command: context.command + " " + subcommand,
                passed: context.arguments[1] ?? "",
            });
        } else {
            await context.respond(CommandPhrases.commandGroupHelp,
                {
                    command: this.getUsageName(context.language),
                    description: this.localizedDescription,
                },
                Array.from(this.children.values()).map(
                    (sub) => ({
                        description: sub.localizedDescription,
                        usage: sub.getShortUsage(context.language, context.prefix),
                    }),
                ),
            );
        }
    }

    /**
     * Gets the instance of the specified subcommand by a name, taking guild aliases and language into account.
     * @param guild The guild to get commands from.
     * @param language The language to use.
     * @param command The name of the command/alias to resolve.
     */
    public getCommandInstance(guild: IExtendedGuild, language: string, command: string) {
        if (!this.guildCommandsMap.has(guild.guild.id)) {
            this.createGuildCommandsMap(guild, language);
        }
        return this.guildCommandsMap.get(guild.guild.id)!.get(command);
    }

    /**
     * Creates a cached map of subcommands for the specified guild and language.
     * @param guild The guild to create the map for.
     * @param language The language to use.
     */
    public createGuildCommandsMap(guild: IExtendedGuild, language: string) {
        if (!this.languageCommandsMap.has(language)) {
            this.createLanguageCommmandsMap(language);
        }
        this.guildCommandsMap.set(guild.guild.id, new Map(this.languageCommandsMap.get(language)!));
    }

    /**
     * Creates a cached map of subcommands for the specified language.
     * @param language The language to use.
     */
    public createLanguageCommmandsMap(language: string) {
        const map: Map<string, Command<any>> = new Map();
        for (const [, command] of this.children) {
            map.set(command.localizedName.get(language), command);
            for (const [alias, aliasCommand] of Object.entries(command.getAliases(language))) {
                map.set(alias, aliasCommand);
            }
        }
        this.languageCommandsMap.set(language, map);
    }

    public getShortUsage(language: string, prefix: string): string {
        if (this.shortUsageCache.has(language)) {
            return this.shortUsageCache.get(language)!;
        }
        let usage = "";
        for (const [, command] of this.children) {
            usage += (usage === "" ? "" : "\n") + command.getShortUsage(language, prefix);
        }
        this.shortUsageCache.set(language, usage);
        return usage;
    }

    public respondHelp(context: ICommandContext) {
        return context.respond(CommandPhrases.commandGroupHelp,
            {
                command: this.getUsageName(context.language),
                description: this.localizedDescription,
            },
            Array.from(this.children.values()).map(
                (sub) => ({
                    description: sub.localizedDescription,
                    usage: sub.getShortUsage(context.language, context.prefix),
                }),
            ),
        );
    }

    /**
     * Iterates over the direct subcommands of this command group.
     */
    public* subcommands(): Generator<Command<any>, void, undefined> {
        yield* this.children.values();
    }

    /**
     * Recursively iterates over all the subcommands of this command group and subcommands.
     */
    public* recurseSubcommands(): Generator<Command<any>, void, undefined> {
        for (const child of this.subcommands()) {
            yield child;
            if (child instanceof CommandGroup) {
                yield* child.recurseSubcommands();
            }
        }
    }
}
