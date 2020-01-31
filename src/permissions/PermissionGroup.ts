import { ConfigEntryGroup } from "../config/entry/ConfigEntryGroup";
import { DEFAULT_LANGUAGE } from "../language/Languages";
import { IPermissionInfo, Permission } from "./Permission";
import { Permissions } from "./Permissions";

/**
 * A parent permission that groups together child permissions.
 * @category Permission
 */
export class PermissionGroup extends Permission {
    /** The child permissions of the permission group. */
    public children: Map<string, Permission>;

    /**
     * Creates a new permission group.
     * @param info Defines basic permission parameters.
     * @param children Defines child permissions for the group.
     */
    constructor(info: IPermissionInfo, children?: Permission[]) {
        super(info);
        this.children = new Map();
        if (children) {
            for (const child of children) {
                child.registerParent(this);
                this.children.set(child.name, child);
            }
        }
    }

    /**
     * Add the specified permissions to the permission group.
     * @param permissions Permissions to add.
     */
    public addPermissions(...permissions: Permission[]) {
        for (const permission of permissions) {
            if (this.children.has(permission.name)) {
                throw new Error(`The permission ${permission.name} is already registered`);
            }
            permission.registerParent(this);
            this.children.set(permission.name, permission);
        }
    }

    /**
     * Remove the specified permissions from the permission group.
     * @param permissions Permissions to remove.
     */
    public removePermissions(...permissions: Permission[]) {
        for (const permission of permissions) {
            if (this.children.has(permission.name)) {
                permission.unregisterParent(this);
                this.children.delete(permission.name);
            }
        }
    }

    public updateFullName() {
        super.updateFullName();
        for (const [, child] of this.children) {
            child.updateFullName();
        }
    }

    public registerSelf(permissions: Permissions) {
        super.registerSelf(permissions);
        for (const [, child] of this.children) {
            child.registerSelf(permissions);
            child.updateFullName();
        }
    }

    public unregisterSelf() {
        super.unregisterSelf();
        for (const [, child] of this.children) {
            child.unregisterSelf();
        }
    }
}
