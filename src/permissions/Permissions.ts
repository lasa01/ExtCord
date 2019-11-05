import { ensureDir, readdir, readFile, writeFile } from "fs-extra";
import { resolve } from "path";

import { Config } from "../config/Config";
import { ConfigEntry } from "../config/entry/ConfigEntry";
import { ConfigEntryGroup } from "../config/entry/ConfigEntryGroup";
import { StringConfigEntry } from "../config/entry/StringConfigEntry";
import { Database } from "../database/Database";
import { Languages } from "../language/Languages";
import { Phrase } from "../language/phrase/Phrase";
import { PhraseGroup } from "../language/phrase/PhraseGroup";
import { Logger } from "../util/Logger";
import { Serializer } from "../util/Serializer";
import { MemberPermissionEntity } from "./database/MemberPermissionEntity";
import { RolePermissionEntity } from "./database/RolePermissionEntity";
import { Permission } from "./Permission";
import { PermissionGroup } from "./PermissionGroup";
import { PermissionPrivilege } from "./PermissionPrivilege";

export class Permissions {
    public database: Database;
    public privilegeDirConfigEntry?: StringConfigEntry;
    // TODO public map instead of this?
    public adminPrivilege: PermissionPrivilege;
    public hostPrivilege: PermissionPrivilege;
    private permissions: Map<string, Permission>;
    private privileges: Map<string, PermissionPrivilege>;
    private privilegePhraseGroup: PhraseGroup;
    private phrases: Phrase[];
    private phraseGroup?: PhraseGroup;
    private configTemplate: Map<string, ConfigEntry>;
    private configEntry?: ConfigEntryGroup;

    constructor(database: Database) {
        this.database = database;
        this.permissions = new Map();
        this.privileges = new Map();
        this.privilegePhraseGroup = new PhraseGroup({ name: "privileges", description: "Permission privileges" });
        this.phrases = [];
        this.configTemplate = new Map();
        database.registerEntity(MemberPermissionEntity);
        database.registerEntity(RolePermissionEntity);
        this.adminPrivilege = new PermissionPrivilege({
            description: "Server administrator permissions",
            name: "admin",
        });
        this.registerPrivilege(this.adminPrivilege);
        this.registerPrivilegePhrase(this.adminPrivilege.phraseGroup);
        this.hostPrivilege = new PermissionPrivilege({
            description: "Bot owner permissions",
            name: "host",
        }, undefined, [this.adminPrivilege]);
        this.registerPrivilege(this.hostPrivilege);
        this.registerPrivilegePhrase(this.hostPrivilege.phraseGroup);
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

    // TODO add directly to group
    public registerPhrase(phrase: Phrase) {
        this.phrases.push(phrase);
    }

    public unregisterPhrase(phrase: Phrase) {
        this.phrases.splice(this.phrases.indexOf(phrase), 1);
    }

    public registerPrivilegePhrase(phrase: Phrase) {
        this.privilegePhraseGroup.addPhrases(phrase);
    }

    public unregisterPrivilegePhrase(phrase: Phrase) {
        this.privilegePhraseGroup.removePhrases(phrase);
    }

    public registerPrivilege(privilege: PermissionPrivilege) {
        this.privileges.set(privilege.name, privilege);
    }

    public unregisterPrivilege(privilege: PermissionPrivilege) {
        this.privileges.delete(privilege.name);
    }

    public registerConfig(config: Config) {
        this.configEntry = new ConfigEntryGroup({
            description: "Default permissions for everyone",
            name: "permissions",
        }, Array.from(this.configTemplate.values()));
        this.privilegeDirConfigEntry = new StringConfigEntry({
            description: "The directory for privilege files",
            name: "privilegesDirectory",
        }, "privileges");
        config.registerEntry(this.configEntry);
        config.registerEntry(this.privilegeDirConfigEntry);
    }

    public registerLanguages(languages: Languages) {
        this.phraseGroup = new PhraseGroup({
            description: "Built-in permissions",
            name: "permissions",
        }, this.phrases);
        languages.registerPhrase(this.phraseGroup);
        languages.registerPhrase(this.privilegePhraseGroup);
    }

    public async loadAllPrivileges(directory?: string) {
        directory = directory ?? this.privilegeDirConfigEntry!.get();
        Logger.verbose("Loading all privileges");
        await ensureDir(directory);
        const dirContent = (await readdir(directory)).filter((file) => file.endsWith(Serializer.extension));
        const internalPrivileges = Array.from(this.privileges.keys());
        for (const filename of dirContent) {
            const path = resolve(directory, filename);
            const privilege = await this.loadPrivilegeFile(path);
            if (privilege && internalPrivileges.includes(privilege.name)) {
                internalPrivileges.splice(internalPrivileges.indexOf(privilege.name), 1);
            }
        }
        // Write remaining internal privileges
        for (const privilege of internalPrivileges) {
            this.writePrivilegeFile(this.privileges.get(privilege)!, directory);
        }
    }

    public async loadPrivilegeFile(path: string) {
        let content;
        try {
            content = await readFile(path, "utf8");
        } catch (err) {
            Logger.error(`An error occured while reading privilege ${path}: ${err}`);
            return;
        }
        return this.loadPrivilegeText(content);
    }

    public async loadPrivilegeText(content: string) {
        let parsed: { [key: string]: any };
        try {
            parsed = Serializer.parse(content);
        } catch (err) {
            Logger.error("An error occured while parsing a privilege: " + err);
            return;
        }
        const name: string = parsed.name;
        let privilege: PermissionPrivilege;
        try {
            if (this.privileges.has(name)) {
                privilege = this.privileges.get(name)!;
                privilege.updateFromRaw(this, parsed);
            } else {
                privilege = PermissionPrivilege.fromRaw(this, parsed);
                this.privileges.set(name, privilege);
            }
            return privilege;
        } catch (err) {
            Logger.error("An error occured while loading a privilege: " + err);
        }
    }

    public async writePrivilegeFile(privilege: PermissionPrivilege, directory: string) {
        Logger.verbose(`Writing privilege file ${privilege.name}`);
        const stringified = Serializer.stringify(privilege.getRaw());
        await writeFile(resolve(directory, privilege.name + Serializer.extension), stringified);
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

    public getPrivilege(name: string) {
        return this.privileges.get(name);
    }

    public getDefaultEntry(name: string) {
        return this.configTemplate.get(name);
    }

    public getStatus() {
        return `${this.permissions.size} permissions loaded: ${Array.from(this.permissions.keys()).join(", ")}`;
    }
}
