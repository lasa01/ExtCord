"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class ConfigEntry extends events_1.EventEmitter {
    constructor(info, defaultValue, type = typeof defaultValue) {
        super();
        this.name = info.name;
        this.fullName = info.name;
        this.description = info.description;
        this.loadStage = info.loadStage == null ? 1 : info.loadStage;
        this.defaultValue = defaultValue;
        this.value = defaultValue;
        this.type = type;
    }
    setParent(parent) {
        this.parent = parent;
    }
    setLoadStage(stage) {
        this.loadStage = stage;
    }
    updateFullName() {
        if (this.parent) {
            this.fullName = this.parent.fullName + "." + this.name;
        }
    }
    validate(data) {
        if (typeof data === this.type) {
            return [false, data];
        }
        if (this.optional) {
            return [true, undefined];
        }
        else {
            return [true, this.defaultValue];
        }
    }
    parse(data) {
        this.value = data;
    }
}
exports.default = ConfigEntry;
//# sourceMappingURL=entry.js.map