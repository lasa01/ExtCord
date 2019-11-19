import { DEFAULT_LANGUAGE } from "../language/Languages";
import { PhraseGroup } from "../language/phrase/PhraseGroup";
import { SimplePhrase } from "../language/phrase/SimplePhrase";
import { Logger } from "../util/Logger";
import { Permission } from "./Permission";
import { Permissions } from "./Permissions";

export class PermissionPrivilege {
    public static fromRaw(permissions: Permissions, raw: { [key: string]: any }) {
        const [name, description, everyone, permTemplate, privTemplate] = this.parseRaw(permissions, raw);
        return new PermissionPrivilege({ name, description, everyone }, permTemplate, privTemplate);
    }

    private static parseRaw(permissions: Permissions, raw: { [key: string]: any }) {
        const name: unknown = raw.name;
        const description: unknown = raw.description;
        const everyone: unknown = raw.everyone;
        const values: unknown = raw.permissions;
        const included: unknown = raw.include;
        if (typeof name !== "string" || typeof description !== "string" || typeof everyone !== "boolean" ||
            typeof values !== "object" || !Array.isArray(included)) {
            throw new Error("A privilege is missing required information");
        }
        const permTemplate: Array<[Permission, boolean]> = [];
        for (const [key, entry] of Object.entries(values as { [key: string]: any })) {
            if (typeof entry !== "boolean") {
                Logger.warn(`Invalid privilege value in ${name} (${key}: ${typeof entry})`);
                continue;
            }
            const permission = permissions.get(key);
            if (!permission) {
                Logger.warn(`Privilege ${name} contains nonexistent permission ${key}`);
                continue;
            }
            permTemplate.push([permission, entry]);
        }
        const privTemplate: PermissionPrivilege[] = [];
        for (const item of included) {
            if (typeof item !== "string") {
                Logger.warn(`Invalid included privilege in ${name} (${typeof item})`);
                continue;
            }
            const privilege = permissions.getBuiltinPrivilege(item);
            if (!privilege) {
                Logger.warn(`Privilege ${name} includes nonexistent privilege ${item}`);
                continue;
            }
            privTemplate.push(privilege);
        }
        return [name, description, everyone, permTemplate, privTemplate] as const;
    }

    public name: string;
    public description: string;
    public localizedDescription?: SimplePhrase;
    public phraseGroup: PhraseGroup;
    public everyone: boolean;
    protected permissionsMap: Map<Permission, boolean>;
    protected included: Map<string, PermissionPrivilege>;

    constructor(info: IPrivilegeInfo, permissions?: Array<[Permission, boolean]>,
                included?: PermissionPrivilege[], everyone = false) {
        this.name = info.name;
        this.description = typeof info.description === "string" ? info.description : info.description[DEFAULT_LANGUAGE];
        this.localizedDescription = new SimplePhrase({
            name: "description",
        }, info.description);
        this.permissionsMap = new Map(permissions);
        this.included = new Map(included ? included.map((priv) => [priv.name, priv]) : undefined);
        this.everyone = everyone;
        this.phraseGroup = new PhraseGroup({ name: this.name }, [
            this.localizedDescription,
        ]);
    }

    public allowPermissions(...permissions: Permission[]) {
        for (const permission of permissions) {
            this.permissionsMap.set(permission, true);
        }
    }

    public denyPermissions(...permissions: Permission[]) {
        for (const permission of permissions) {
            this.permissionsMap.set(permission, false);
        }
    }

    public addPermissions(...permissions: Array<[Permission, boolean]>) {
        for (const [permission, allow] of permissions) {
            this.permissionsMap.set(permission, allow);
        }
    }

    public removePermissions(...permissions: Permission[]) {
        for (const permission of permissions) {
            if (this.permissionsMap.has(permission)) {
                this.permissionsMap.delete(permission);
            }
        }
    }

    public includePrivileges(...privileges: PermissionPrivilege[]) {
        for (const privilege of privileges) {
            this.included.set(privilege.name, privilege);
        }
    }

    public excludePrivileges(...privileges: PermissionPrivilege[]) {
        for (const privilege of privileges) {
            if (this.included.has(privilege.name)) {
                this.included.delete(privilege.name);
            }
        }
    }

    public updateFromRaw(permissions: Permissions, raw: { [key: string]: any }) {
        const [name, descr, everyone, permTemplate, privTemplate] = PermissionPrivilege.parseRaw(permissions, raw);
        if (name !== this.name) {
            throw new Error(`Trying to update privilege ${this.name} with data identifying as ${name}`);
        }
        this.description = descr;
        this.everyone = everyone;
        this.permissionsMap = new Map(permTemplate);
        this.included = new Map(privTemplate ? privTemplate.map((priv) => [priv.name, priv]) : undefined);
    }

    public includesPrivilege(privilege: PermissionPrivilege) {
        if (this.included.has(privilege.name)) {
            return true;
        }
        for (const [, included] of this.included) {
            if (included.includesPrivilege(privilege)) {
                return true;
            }
        }
        return false;
    }

    public getPermissionsMap() {
        // TODO cache
        const map: Map<Permission, boolean> = new Map();
        for (const [, include] of this.included) {
            const includeMap = include.getPermissionsMap();
            for (const [key, value] of includeMap) {
                map.set(key, value);
            }
        }
        for (const [key, value] of this.permissionsMap) {
            map.set(key, value);
        }
        return map;
    }

    public getRaw() {
        const obj = {
            description: this.description,
            everyone: this.everyone,
            include: [] as string[],
            name: this.name,
            permissions: {} as { [key: string]: boolean },
        };
        for (const [name] of this.included) {
            obj.include.push(name);
        }
        for (const [permission, value] of this.permissionsMap) {
            obj.permissions[permission.fullName] = value;
        }
        return obj;
    }
}

export interface IPrivilegeInfo {
    name: string;
    description: string | Record<string, string>;
    everyone?: boolean;
}
