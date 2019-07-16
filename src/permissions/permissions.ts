import { Logger } from "winston";

import { Config } from "../config/config";
import { ConfigEntry } from "../config/entry/entry";
import { ConfigEntryGroup } from "../config/entry/entrygroup";
import { Database } from "../database/database";
import { Languages } from "../language/languages";
import { Phrase } from "../language/phrase/phrase";
import { PhraseGroup } from "../language/phrase/phrasegroup";
import { MemberPermissionEntity } from "./database/memberpermissionentity";
import { RolePermissionEntity } from "./database/rolepermissionentity";
import { Permission } from "./permission";
import { PermissionGroup } from "./permissiongroup";

export class Permissions {
    public database: Database;
    private permissions: Map<string, Permission>;
    private phrases: Phrase[];
    private phraseGroup?: PhraseGroup;
    private configTemplate: Map<string, ConfigEntry>;
    private configEntry?: ConfigEntryGroup;

    constructor(database: Database) {
        this.database = database;
        this.permissions = new Map();
        this.phrases = [];
        this.configTemplate = new Map();
        database.registerEntity(MemberPermissionEntity);
        database.registerEntity(RolePermissionEntity);
    }

    public register(permission: Permission) {
        permission.registerPermissions(this);
        this.permissions.set(permission.name, permission);
        this.configTemplate.set(permission.name, permission.getConfigEntry());
    }

    public unregister(permission: Permission) {
        permission.unregisterPermissions();
        this.permissions.delete(permission.name);
        this.configTemplate.delete(permission.name);
    }

    public registerPhrase(phrase: Phrase) {
        this.phrases.push(phrase);
    }

    public unregisterPhrase(phrase: Phrase) {
        this.phrases.splice(this.phrases.indexOf(phrase), 1);
    }

    public registerConfig(config: Config) {
        this.configEntry = new ConfigEntryGroup({
            description: "Default permissions for everyone",
            name: "permissions",
        }, Array.from(this.configTemplate.values()));
        config.register(this.configEntry);
    }

    public registerLanguages(languages: Languages) {
        this.phraseGroup = new PhraseGroup({
            description: "Built-in permissions",
            name: "permissions",
        }, this.phrases);
        languages.register(this.phraseGroup);
    }

    public get(name: string) {
        const tree = name.split(".");
        let permission = this.permissions.get(tree.shift()!);
        for (const sub of tree) {
            if (!(permission instanceof PermissionGroup)) { return; }
            permission = permission.children.get(sub);
        }
        return permission;
    }

    public getDefaultEntry(name: string) {
        return this.configTemplate.get(name);
    }

    public getStatus() {
        return `${this.permissions.size} permissions loaded: ${Array.from(this.permissions.keys()).join(", ")}`;
    }
}
