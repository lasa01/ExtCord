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

export class CommandGroup
    extends Command<[typeof BuiltInArguments.subcommand, typeof BuiltInArguments.subcommandArguments]> {
    public children: Map<string, Command<any>>;
    public defaultSubcommand?: string;
    protected subPhraseGroup: PhraseGroup;
    private languageCommandsMap: Map<string, Map<string, Command<any>>>;
    private guildCommandsMap: Map<string, Map<string, Command<any>>>;

    constructor(info: ICommandInfo, defaultSubcommand?: string, children?: ReadonlyArray<Command<any>>,
                allowed?: Array<string|PermissionPrivilege>) {
        super(info, [ BuiltInArguments.subcommand, BuiltInArguments.subcommandArguments ], allowed,
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
        if (defaultSubcommand) {
            if (!this.children.has(defaultSubcommand)) {
                throw new Error(`The default subcommand ${defaultSubcommand} doesn't exist`);
            }
            if (this.children.get(defaultSubcommand)!.minArguments !== 0) {
                throw new Error(`The default subcommand has required arguments`);
            }
        }
        this.languageCommandsMap = new Map();
        this.guildCommandsMap = new Map();
    }

    public updateFullName() {
        super.updateFullName();
        for (const [, child] of this.children) {
            child.updateFullName();
        }
    }

    public registerSelf(bot: Bot) {
        super.registerSelf(bot);
        for (const [, child] of this.children) {
            child.registerSelf(bot);
        }
    }

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

    public addSubPhrases(...phrases: Phrase[]) {
        this.subPhraseGroup.addPhrases(...phrases);
    }

    public removeSubPhrases(...phrases: Phrase[]) {
        this.subPhraseGroup.removePhrases(...phrases);
    }

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
            await context.respond(CommandPhrases.commandGroupUsage, { description: this.localizedDescription },
                Array.from(this.children.values()).map(
                    (sub) => ({ description: sub.localizedDescription, usage: sub.getShortUsage(context.language)}),
                ),
            );
        }
    }

    public getCommandInstance(guild: IExtendedGuild, language: string, command: string) {
        if (!this.guildCommandsMap.has(guild.guild.id)) {
            this.createGuildCommandsMap(guild, language);
        }
        return this.guildCommandsMap.get(guild.guild.id)!.get(command);
    }

    public createGuildCommandsMap(guild: IExtendedGuild, language: string) {
        if (!this.languageCommandsMap.has(language)) {
            this.createLanguageCommmandsMap(language);
        }
        this.guildCommandsMap.set(guild.guild.id, new Map(this.languageCommandsMap.get(language)!));
    }

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
}
