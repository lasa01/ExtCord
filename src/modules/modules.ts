import Module from "./module";

import FS from "fs";
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
        const readdir = (path: string) => new Promise<string[]>((resolve, reject) =>
            FS.readdir(path, (err, files) => { if (err) { reject(err); } else { resolve(files); } }));
        const modules = await readdir(moduleDir);
        for (const fileName of modules) {
            const loaded = require(Path.join(moduleDir, fileName));
            if (!Module.isPrototypeOf(loaded)) {
                this.logger.warn(`Skipping a non-module file "${fileName}"`);
                continue;
            }
            this.loadModule(loaded);
        }
    }
}
