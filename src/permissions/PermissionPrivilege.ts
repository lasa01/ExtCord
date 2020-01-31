import { DEFAULT_LANGUAGE } from "../language/Languages";
import { PhraseGroup } from "../language/phrase/PhraseGroup";
import { SimplePhrase } from "../language/phrase/SimplePhrase";
import { Logger } from "../util/Logger";
import { Permission } from "./Permission";
import { Permissions } from "./Permissions";

/**
 * A base class for all permission privileges.
 * @category Permission
 */
export class PermissionPrivilege {
    /**
     * Creates a permission privilege instance from a raw, serializable object.
     * @param permissions The permission manager to get included privileges from.
     * @param raw The raw privilege object.
     */
    public static fromRaw(permissions: Permissions, raw: { [key: string]: any }) {
        const [name, description, permTemplate, privTemplate] = this.parseRaw(permissions, raw);
        return new PermissionPrivilege({ name, description }, permTemplate, privTemplate);
    }

    private static parseRaw(permissions: Permissions, raw: { [key: string]: any }) {
        const name: unknown = raw.name;
        const description: unknown = raw.description;
        const values: unknown = raw.permissions;
        const included: unknown = raw.include;
        if (typeof name !== "string" || typeof description !== "string" ||
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
        return [name, description, permTemplate, privTemplate] as const;
    }

    /** The name the privilege is registered by internally. */
    public name: string;
    /** The description of the privilege in the default language. */
    public description: string;
    /** The localized description of the privilege. */
    public localizedDescription?: SimplePhrase;
    /** The phrase group of the privilege for registration purposes. */
    public phraseGroup: PhraseGroup;
    protected permissionsMap: Map<Permission, boolean>;
    protected included: Map<string, PermissionPrivilege>;

    /**
     * Creates a new permission privilege.
     * @param info Defines basic privilege parameters.
     * @param permissions An array of tuples of [[Permission]] instances
     * and boolean values of whether to allow or deny the permission for this privilege.
     * @param included Defines privileges whose permissions are included in this privilege.
     */
    constructor(info: IPrivilegeInfo, permissions?: Array<[Permission, boolean]>, included?: PermissionPrivilege[]) {
        this.name = info.name;
        this.description = typeof info.description === "string" ? info.description : info.description[DEFAULT_LANGUAGE];
        this.localizedDescription = new SimplePhrase({
            name: "description",
        }, info.description);
        this.permissionsMap = new Map(permissions);
        this.included = new Map(included ? included.map((priv) => [priv.name, priv]) : undefined);
        this.phraseGroup = new PhraseGroup({ name: this.name }, [
            this.localizedDescription,
        ]);
    }

    /**
     * Allow permissions for the privilege.
     * @param permissions Permissions to allow.
     */
    public allowPermissions(...permissions: Permission[]) {
        for (const permission of permissions) {
            this.permissionsMap.set(permission, true);
        }
    }

    /**
     * Deny permissions for the privilege.
     * @param permissions Permissions to deny.
     */
    public denyPermissions(...permissions: Permission[]) {
        for (const permission of permissions) {
            this.permissionsMap.set(permission, false);
        }
    }

    /**
     * Add permissions to the privilege.
     * @param permissions An array of tuples of [[Permission]] instances
     * and boolean values of whether to allow or deny the permission for this privilege.
     */
    public addPermissions(...permissions: Array<[Permission, boolean]>) {
        for (const [permission, allow] of permissions) {
            this.permissionsMap.set(permission, allow);
        }
    }

    /**
     * Remove permissions from the privilege.
     * @param permissions Permissions to remove.
     */
    public removePermissions(...permissions: Permission[]) {
        for (const permission of permissions) {
            if (this.permissionsMap.has(permission)) {
                this.permissionsMap.delete(permission);
            }
        }
    }

    /**
     * Include privileges' permissions to the privilege.
     * @param privileges Privileges to add to included privileges.
     */
    public includePrivileges(...privileges: PermissionPrivilege[]) {
        for (const privilege of privileges) {
            this.included.set(privilege.name, privilege);
        }
    }

    /**
     * Remove included privileges from the privilege.
     * @param privileges Privileges to remove from included privileges.
     */
    public excludePrivileges(...privileges: PermissionPrivilege[]) {
        for (const privilege of privileges) {
            if (this.included.has(privilege.name)) {
                this.included.delete(privilege.name);
            }
        }
    }

    /**
     * Update the privilege description, permissions and includes from a raw object.
     * @param permissions The permission manager to get included privileges from.
     * @param raw The raw privilege object.
     */
    public updateFromRaw(permissions: Permissions, raw: { [key: string]: any }) {
        const [name, descr, permTemplate, privTemplate] =
            PermissionPrivilege.parseRaw(permissions, raw);
        if (name !== this.name) {
            throw new Error(`Trying to update privilege ${this.name} with data identifying as ${name}`);
        }
        this.description = descr;
        this.permissionsMap = new Map(permTemplate);
        this.included = new Map(privTemplate ? privTemplate.map((priv) => [priv.name, priv]) : undefined);
    }

    /**
     * Recursively checks if the privilege includes a privilege directly or through included privileges.
     * @param privilege The privilege to check.
     */
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

    /** Get the permission map of the privilege. */
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

    /** Get the raw, serializable privilege object for the privilege. */
    public getRaw() {
        const obj = {
            description: this.description,
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

/**
 * Defines basic privilege parameters.
 * @category Permission
 */
export interface IPrivilegeInfo {
    /** Name of the privilege. */
    name: string;
    /**
     * Description of the privilege.
     * Can be either a string, in which case it is assumed to be in [[DEFAULT_LANGUAGE]],
     * or an object, in which case the keys are languages and the values are associated localized descriptions.
     */
    description: string | Record<string, string>;
}
