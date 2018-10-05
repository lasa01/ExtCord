import Module from "./module";

import {promises as FS} from "fs";
import Path from "path";
import Winston from "winston";

export default class Modules {
    private logger: Winston.Logger;
    private modules: Map<string, Module>;

    constructor(logger: Winston.Logger) {
        this.logger = logger;
        this.modules = new Map();
    }

    public loadModule(module: typeof Module) {
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

    public async loadAll(moduleDir: string) {
        const modules = await FS.readdir(moduleDir);
        for (const fileName of modules) {
            const loaded = require(Path.join(moduleDir, fileName));
            if (!Module.isPrototypeOf(loaded)) {
                this.logger.warn(`Found a non-module file "${fileName}", skipping`);
                continue;
            }
            this.loadModule(loaded);
        }
    }
}
