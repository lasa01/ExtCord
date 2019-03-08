import { ConfigEntryGroup } from "../config/entry/entrygroup";
import { IPermissionInfo, Permission } from "./permission";
import { Permissions } from "./permissions";

export class PermissionGroup extends Permission {
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
            child.registerParent(this);
            this.children.set(child.name, child);
        }
    }

    public updateFullName() {
        super.updateFullName();
        for (const [, child] of this.children) {
            child.updateFullName();
        }
    }

    public register(permissions: Permissions) {
        super.register(permissions);
        for (const [, child] of this.children) {
            child.register(permissions);
        }
    }
}
