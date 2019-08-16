import { ConfigEntryGroup } from "../config/entry/ConfigEntryGroup";
import { IPermissionInfo, Permission } from "./Permission";
import { Permissions } from "./Permissions";

export class PermissionGroup extends Permission {
    public children: Map<string, Permission>;

    constructor(info: IPermissionInfo, children?: Permission[]) {
        const configs = [];
        if (children) {
            for (const child of children) {
                configs.push(child.getConfigEntry());
            }
        }
        super(info, new ConfigEntryGroup({
            description: info.description,
            name: info.name,
        }, configs));
        this.children = new Map();
        if (children) {
            for (const child of children) {
                child.registerParent(this);
                this.children.set(child.name, child);
            }
        }
    }

    public addPermissions(...permissions: Permission[]) {
        for (const permission of permissions) {
            if (this.children.has(permission.name)) {
                throw new Error(`The permission ${permission.name} is already registered`);
            }
            (this.getConfigEntry() as ConfigEntryGroup).addEntries(permission.getConfigEntry());
            permission.registerParent(this);
            this.children.set(permission.name, permission);
        }
    }

    public removePermissions(...permissions: Permission[]) {
        for (const permission of permissions) {
            if (this.children.has(permission.name)) {
                (this.getConfigEntry() as ConfigEntryGroup).removeEntries(permission.getConfigEntry());
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
