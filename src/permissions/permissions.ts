import Winston from "winston";

import Config from "../config/config";
import ConfigEntry from "../config/entry/entry";
import ConfigEntryGroup from "../config/entry/entrygroup";
import Database from "../database/database";
import MemberPermissionEntity from "./database/memberpermissionentity";
import RolePermissionEntity from "./database/rolepermissionentity";
import Permission from "./permission";

export default class Permissions {
    public static registerDatabase(database: Database) {
        database.registerEntity(MemberPermissionEntity);
        database.registerEntity(RolePermissionEntity);
    }

    public database: Database;
    public logger: Winston.Logger;
    private permissions: Map<string, Permission>;
    private configTemplate: Map<string, ConfigEntry>;
    private configEntry?: ConfigEntryGroup;

    constructor(logger: Winston.Logger, database: Database) {
        this.logger = logger;
        this.database = database;
        this.permissions = new Map();
        this.configTemplate = new Map();
    }

    public register(permission: Permission) {
        this.permissions.set(permission.name, permission);
        this.configTemplate.set(permission.name, permission.getConfigEntry());
    }

    public registerConfig(config: Config) {
        this.configEntry = new ConfigEntryGroup({
            description: "Default permissions for everyone",
            name: "permissions",
        }, Array.from(this.configTemplate.values()));
        config.register(this.configEntry);
    }

    public getDefaultEntry(name: string) {
        return this.configTemplate.get(name);
    }
}
