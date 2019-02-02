import Winston from "winston";

import Permission from "../permissions/permission";
import PermissionGroup from "../permissions/permissiongroup";
import Permissions from "../permissions/permissions";
import Command from "./command";

export default class Commands {
    private logger: Winston.Logger;
    private commands: Map<string, Command>;
    private permissionTemplate: Map<string, Permission>;
    private permission?: Permission;

    constructor(logger: Winston.Logger) {
        this.logger = logger;
        this.commands = new Map();
        this.permissionTemplate = new Map();
    }

    public register(command: Command) {
        if (this.commands.has(command.name)) {
            this.logger.warn(`Multiple commands with the same name detected, renaming "${command.name}"`);
            if (this.commands.has(command.rename())) {
                this.logger.error(`Naming conflict with "${command.name}", command ignored`);
                return;
            }
        }
        this.commands.set(command.name, command);
        this.permissionTemplate.set(command.name, command.getPermission());
    }

    public registerPermissions(permissions: Permissions) {
        this.permission = new PermissionGroup({
            description: "Command permissions",
            name: "commands",
        }, Array.from(this.permissionTemplate.values()));
        permissions.register(this.permission);
    }

    public getStatus() {
        return `${this.commands.size} commands loaded: ${Array.from(this.commands.keys()).join(", ")}`;
    }
}
