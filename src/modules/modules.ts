import Module from "./module";

import FS from "fs";
import Path from "path";
import Winston from "winston";
import Bot from "../bot";

export default class Modules {
    private logger: Winston.Logger;
    private modules: Map<string, Module>;
    private bot: Bot;

    constructor(logger: Winston.Logger, bot: Bot) {
        this.logger = logger;
        this.modules = new Map();
        this.bot = bot;
    }

    public loadModule(module: new (bot: Bot) => Module) {
        const constructed = new module(this.bot);
        if (constructed.name === "" || constructed.author === "") {
            this.logger.warn(`Skipping module with empty name or author`);
            return;
        }
        if (this.modules.has(constructed.name)) {
            this.logger.warn(`Trying to load an already loaded module ${constructed.name}`);
        }
        this.modules.set(constructed.name, constructed);
        this.logger.info(`Loaded module ${constructed.name}`);
    }

    public async loadAll(moduleDir: string) {
        this.logger.info("Loading all modules");
        const readdir = (path: string) => new Promise<string[]>((resolve, reject) =>
            FS.readdir(path, (err, files) => { if (err) { reject(err); } else { resolve(files); } }));
        const modules = await readdir(moduleDir);
        for (const fileName of modules) {
            // Skip non-module files
            if (!fileName.endsWith(".js")) { continue; }
            const loaded = require(Path.join(process.cwd(), moduleDir, fileName)).default;
            if (!Module.isPrototypeOf(loaded)) {
                this.logger.warn(`Skipping a non-module file "${fileName}"`);
                continue;
            }
            this.loadModule(loaded);
        }
    }
}
