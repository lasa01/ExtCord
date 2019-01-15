import Winston from "winston";

import Config from "../config/config";
import BooleanConfigEntry from "../config/entry/booleanentry";
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
    private config: Config;
    private logger: Winston.Logger;
    private permissions: Map<string, Permission>;
    private configTemplate: Map<string, BooleanConfigEntry>;

    constructor(logger: Winston.Logger, database: Database, config: Config) {
        this.logger = logger;
        this.database = database;
        this.config = config;
        this.permissions = new Map();
        this.configTemplate = new Map();
    }

    public registerDefaultEntry(name: string, value: boolean) {
        const entry = new BooleanConfigEntry({
            description: `Default value for permission ${name}`,
            name,
        }, value);
        this.configTemplate.set(name, entry);
        return entry;
    }

    public getDefaultEntry(name: string) {
        return this.configTemplate.get(name);
    }
}
