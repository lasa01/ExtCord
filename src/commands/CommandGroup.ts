import { Phrase } from "../language/phrase/Phrase";
import { PhraseGroup } from "../language/phrase/PhraseGroup";
import { PermissionGroup } from "../permissions/PermissionGroup";
import { BuiltInArguments } from "./arguments/BuiltinArguments";
import { Command, ICommandInfo, IExecutionContext } from "./Command";
import { CommandPhrases } from "./CommandPhrases";

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
            await context.respond(CommandPhrases.commandGroupUsage, {},
                Array.from(this.children.values()).map(
                    (sub) => ({ description: sub.localizedDescription, usage: sub.getShortUsage(context.language)}),
                ),
            );
        }
    }
}
