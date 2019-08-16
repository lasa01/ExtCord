import { Config } from "../config/Config";
import { ConfigEntry } from "../config/entry/ConfigEntry";
import { ConfigEntryGroup } from "../config/entry/ConfigEntryGroup";
import { Database } from "../database/Database";
import { Languages } from "../language/Languages";
import { Phrase } from "../language/phrase/Phrase";
import { PhraseGroup } from "../language/phrase/PhraseGroup";
import { MemberPermissionEntity } from "./database/MemberPermissionEntity";
import { RolePermissionEntity } from "./database/RolePermissionEntity";
import { Permission } from "./Permission";
import { PermissionGroup } from "./PermissionGroup";

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

    public registerPermission(permission: Permission) {
        permission.registerSelf(this);
        this.permissions.set(permission.name, permission);
        this.configTemplate.set(permission.name, permission.getConfigEntry());
    }

    public unregisterPermission(permission: Permission) {
        permission.unregisterSelf();
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
        config.registerEntry(this.configEntry);
    }

    public registerLanguages(languages: Languages) {
        this.phraseGroup = new PhraseGroup({
            description: "Built-in permissions",
            name: "permissions",
        }, this.phrases);
        languages.registerPhrase(this.phraseGroup);
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
