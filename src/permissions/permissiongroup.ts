import ConfigEntryGroup from "../config/entry/entrygroup";
import Permission, { IPermissionInfo } from "./permission";
import Permissions from "./permissions";

export default class PermissionGroup extends Permission {
    public children: Map<string, Permission>;

    constructor(info: IPermissionInfo, children: Permission[]) {
        const configs = [];
        for (const child of children) {
            configs.push(child.getConfigEntry());
        }
        super(info, false, new ConfigEntryGroup({
            description: info.description,
            name: info.name,
        }, configs));
        this.children = new Map();
        for (const child of children) {
            child.setParent(this);
            this.children.set(child.name, child);
        }
    }

    public updateFullName() {
        super.updateFullName();
        for (const [, child] of this.children) {
            child.updateFullName();
        }
    }

    public setPermissions(permissions: Permissions) {
        super.setPermissions(permissions);
        for (const [, child] of this.children) {
            child.setPermissions(permissions);
        }
    }
}