import { Phrase } from "../language/phrase/phrase";
import { PhraseGroup } from "../language/phrase/phrasegroup";
import { PermissionGroup } from "../permissions/permissiongroup";
import { BuiltInArguments } from "./arguments/builtinarguments";
import { Command, ICommandInfo, IExecutionContext } from "./command";

export class CommandGroup extends Command {
    public children: Map<string, Command>;
    private subPhraseGroup?: PhraseGroup;
    private subPhrases: Phrase[];

    constructor(info: ICommandInfo, children: Command[], allowEveryone = false) {
        const permissions = [];
        for (const child of children) {
            permissions.push(child.getPermission());
        }
        super(info, [ BuiltInArguments.subCommand ], allowEveryone, new PermissionGroup({
            description: `Gives the permission for the command group ${name}`,
            name: info.name,
        }, permissions));
        this.children = new Map();
        this.subPhrases = [];
        for (const child of children) {
            this.children.set(child.name, child);
            child.registerParent(this);
        }
    }

    public registerSubPhrase(phrase: Phrase) {
        this.subPhrases.push(phrase);
    }

    public unregisterSubPhrase(phrase: Phrase) {
        this.subPhrases.splice(this.subPhrases.indexOf(phrase), 1);
    }

    public async execute(context: IExecutionContext) {
        const subcommand: string = context.arguments.shift();
        if (!this.children.has(subcommand)) {
            return; // For now
        }
        this.children.get(subcommand)!.execute(context);
    }

    protected makePhrases() {
        this.subPhraseGroup = new PhraseGroup({
            name: "subcommands",
        }, this.subPhrases);
        this.phraseGroup = new PhraseGroup({
            name: this.name,
        }, [ this.localizedDescription, this.localizedName, this.subPhraseGroup ]);
    }
}
