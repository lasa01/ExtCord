import ConfigEntryGroup from "../config/entry/entrygroup";
import Permission, { IPermissionInfo } from "./permission";
import Permissions from "./permissions";

export default class PermissionGroup extends Permission {
    public entries: Map<string, Permission>;

    constructor(info: IPermissionInfo, entries: Permission[]) {
        const configs = [];
        for (const entry of entries) {
            configs.push(entry.getConfigEntry());
        }
        super(info, false, new ConfigEntryGroup({
            description: `Determines if everyone is allowed permission ${name} by default`,
            name,
        }, configs));
        this.entries = new Map();
        for (const entry of entries) {
            entry.setParent(this);
            this.entries.set(entry.name, entry);
        }
    }

    public updateFullName() {
        super.updateFullName();
        for (const [, entry] of this.entries) {
            entry.updateFullName();
        }
    }

    public setPermissions(permissions: Permissions) {
        super.setPermissions(permissions);
        for (const [, entry] of this.entries) {
            entry.setPermissions(permissions);
        }
    }
}
