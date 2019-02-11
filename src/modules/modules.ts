import Module from "./module";

import Path from "path";
import Winston from "winston";

import Bot from "../bot";
import AsyncFS from "../util/asyncfs";

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
        const modules = await AsyncFS.readdir(moduleDir);
        for (const fileName of modules) {
            let path = Path.resolve(process.cwd(), moduleDir, fileName);
            const stats = await AsyncFS.stat(path);
            if (stats.isDirectory()) {
                // Module is a directory, use index.js, TODO check if doesn't exist
                path = Path.join(path, "index.js");
            }
            // Skip files that aren't javascript
            if (!path.endsWith(".js")) { return; }
            try {
                const loaded = require(path).default;
                if (!Module.isPrototypeOf(loaded)) {
                    this.logger.warn(`Skipping a non-module file "${fileName}"`);
                    continue;
                }
                this.loadModule(loaded);
            } catch (error) {
                this.logger.error(`Error while loading module ${fileName}: ${error}`);
            }
        }
    }
}
