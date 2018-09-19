"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const entry_1 = __importDefault(require("./entry"));
class EntryGroup extends entry_1.default {
    constructor(info, entries) {
        super(info);
        this.entries = new Map();
        for (const entry of entries) {
            entry.setParent(this);
            entry.setLoadStage(this.loadStage);
            this.entries.set(entry.name, entry);
        }
    }
    setLoadStage(stage) {
        super.setLoadStage(stage);
        for (const [, entry] of this.entries) {
            entry.setLoadStage(stage);
        }
    }
    updateFullName() {
        super.updateFullName();
        for (const [, entry] of this.entries) {
            entry.updateFullName();
        }
    }
    validate(data) {
        let updated = false;
        for (const [name, entry] of this.entries) {
            let u;
            [u, data[name]] = entry.validate(data[name]);
            if (u) {
                updated = true;
            }
        }
        return [updated, data];
    }
    parse(data) {
        for (const [name, entry] of this.entries) {
            entry.parse(data[name]);
        }
    }
}
exports.default = EntryGroup;
//# sourceMappingURL=entrygroup.js.map