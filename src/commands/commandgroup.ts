import { Phrase } from "../language/phrase/phrase";
import { PhraseGroup } from "../language/phrase/phrasegroup";
import { PermissionGroup } from "../permissions/permissiongroup";
import { BuiltInArguments } from "./arguments/builtinarguments";
import { Command, ICommandInfo, IExecutionContext } from "./command";
import { CommandPhrases } from "./commandphrases";

export class CommandGroup
    extends Command<[typeof BuiltInArguments.subcommand, typeof BuiltInArguments.subcommandArguments]> {
    public children: Map<string, Command<any>>;
    public defaultSubcommand?: string;
    protected subPhraseGroup: PhraseGroup;

    constructor(info: ICommandInfo, defaultSubcommand?: string, children?: ReadonlyArray<Command<any>>) {
        super(info, [ BuiltInArguments.subcommand, BuiltInArguments.subcommandArguments ],
            new PermissionGroup({
                description: `Gives the permission for the command group ${info.name}`,
                name: info.name,
            }));
        this.children = new Map();
        this.subPhraseGroup = new PhraseGroup({
            name: "subcommands",
        });
        this.phraseGroup.removePhrase(this.argPhraseGroup);
        this.phraseGroup.addPhrase(this.subPhraseGroup);
        this.defaultSubcommand = defaultSubcommand;
        if (children) {
            for (const child of children) {
                this.children.set(child.name, child);
                this.registerSubPhrase(child.phraseGroup);
                (this.defaultPermission as PermissionGroup).addPermission(child.getPermission());
            }
        }
        if (defaultSubcommand) {
            if (!this.children.has(defaultSubcommand)) {
                throw new Error(`The default subcommand ${defaultSubcommand} doesn't exist`);
            }
            if (this.children.get(defaultSubcommand)!.minArguments !== 0) {
                throw new Error(`The default subcommand has required arguments`);
            }
        }
    }

    public addSubcommand(subcommand: Command<any>) {
        if (this.children.has(subcommand.name)) {
            throw new Error(`The subcommand ${subcommand.name} is already registered`);
        }
        this.children.set(subcommand.name, subcommand);
        this.registerSubPhrase(subcommand.phraseGroup);
        (this.defaultPermission as PermissionGroup).addPermission(subcommand.getPermission());
    }

    public removeSubcommand(subcommand: Command<any>) {
        if (this.children.has(subcommand.name)) {
            this.children.delete(subcommand.name);
            this.unregisterSubPhrase(subcommand.phraseGroup);
            (this.defaultPermission as PermissionGroup).removePermission(subcommand.getPermission());
        }
    }

    public registerSubPhrase(phrase: Phrase) {
        this.subPhraseGroup.addPhrase(phrase);
    }

    public unregisterSubPhrase(phrase: Phrase) {
        this.subPhraseGroup.removePhrase(phrase);
    }

    public async execute(
        context: IExecutionContext<[typeof BuiltInArguments.subcommand, typeof BuiltInArguments.subcommandArguments]>) {
        const subcommand = context.arguments[0] || this.defaultSubcommand;
        if (subcommand) {
            if (!this.children.has(subcommand)) {
                await context.respond(CommandPhrases.invalidSubcommand, { subcommand });
                return;
            }
            await this.children.get(subcommand)!.command({
                ...context,
                command: context.command + " " + subcommand,
                passed: context.arguments[1] || "",
            });
        } else {
            await context.respond(CommandPhrases.availableSubcommands, {
                subcommands:  Array.from(this.children.keys()).join(", "),
            });
        }
    }
}
