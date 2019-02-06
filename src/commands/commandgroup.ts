import PermissionGroup from "../permissions/permissiongroup";
import StringArgument from "./arguments/stringargument";
import Command, { ICommandInfo, IExecutionContext } from "./command";

export default class CommandGroup extends Command {
    public children: Map<string, Command>;

    constructor(info: ICommandInfo, children: Command[], allowEveryone = false) {
        const permissions = [];
        for (const child of children) {
            permissions.push(child.getPermission());
        }
        super(info, [new StringArgument({
            description: "the subcommand to call",
            name: "subcommand",
        })], allowEveryone, new PermissionGroup({
            description: `Gives the permission for the command group ${name}`,
            name: info.name,
        }, permissions));
        this.children = new Map();
    }

    protected async execute(context: IExecutionContext) {
        // TODO call correct child command
    }
}
