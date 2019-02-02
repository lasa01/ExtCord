import Module from "../modules/module";
import PermissionGroup from "../permissions/permissiongroup";
import Command, { IExecutionContext } from "./command";

export default class CommandGroup extends Command {
    public children: Map<string, Command>;

    constructor(name: string, author: Module | string, children: Command[], allowEveryone = false) {
        const permissions = [];
        for (const child of children) {
            permissions.push(child.getPermission());
        }
        super(name, author, allowEveryone, new PermissionGroup({
            description: `Gives the permission for the command group ${name}`,
            name,
        }, permissions));
        this.children = new Map();
    }

    protected async execute(context: IExecutionContext) {
        // TODO call correct child command
    }
}
