"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const module_1 = __importDefault(require("./module"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
class Modules {
    constructor(logger) {
        this.logger = logger;
        this.modules = new Map();
    }
    loadModule(module) {
        const constructed = new module();
        if (constructed.name === "" || constructed.author === "") {
            this.logger.warn(`Skipping module with empty name or author`);
            return;
        }
        if (this.modules.has(constructed.name)) {
            this.logger.warn(`Trying to load already loaded module ${constructed.name}`);
        }
        this.modules.set(constructed.name, constructed);
    }
    async loadAll(moduleDir) {
        const modules = await fs_1.promises.readdir(moduleDir);
        for (const fileName of modules) {
            const loaded = require(path_1.default.join(moduleDir, fileName));
            if (!module_1.default.isPrototypeOf(loaded)) {
                this.logger.warn(`Found a non-module file "${fileName}", skipping`);
                continue;
            }
            this.loadModule(loaded);
        }
    }
}
exports.default = Modules;
//# sourceMappingURL=modules.js.map