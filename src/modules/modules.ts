import { EventEmitter } from "events";
import { ensureDir, readdir, stat } from "fs-extra";
import { resolve } from "path";
import { Logger } from "winston";

import { Bot } from "../bot";
import { Config } from "../config/config";
import { ConfigEntryGroup } from "../config/entry/entrygroup";
import { StringConfigEntry } from "../config/entry/stringentry";
import { Module } from "./module";

// Event definitions
// tslint:disable-next-line:interface-name
export interface Modules {
    /** @event */
    addListener(event: "loaded", listener: () => void): this;
    /** @event */
    emit(event: "loaded"): boolean;
    /** @event */
    on(event: "loaded", listener: () => void): this;
    /** @event */
    once(event: "loaded", listener: () => void): this;
    /** @event */
    prependListener(event: "loaded", listener: () => void): this;
    /** @event */
    prependOnceListener(event: "loaded", listener: () => void): this;
}

export class Modules extends EventEmitter {
    public moduleDirConfigEntry?: StringConfigEntry;
    private logger: Logger;
    private modules: Map<string, Module>;
    private bot: Bot;
    private configEntry?: ConfigEntryGroup;

    constructor(logger: Logger, bot: Bot) {
        super();
        this.logger = logger;
        this.modules = new Map();
        this.bot = bot;
    }

    public async loadModule(module: new (bot: Bot) => Module) {
        const constructed = new module(this.bot);
        if (constructed.name === "" || constructed.author === "") {
            this.logger.error("A module has an empty name and/or author");
            await constructed.unload();
            return;
        }
        if (this.modules.has(constructed.name)) {
            this.logger.warn(`Module ${constructed.name} has a non-unique name, renaming...`);
            constructed.rename();
            if (this.modules.has(constructed.name)) {
                this.logger.error("Renaming failed");
                await constructed.unload();
                return;
            }
        }
        this.modules.set(constructed.name, constructed);
        constructed.load();
        this.logger.info(`Loaded module ${constructed.name}`);
    }

    public async loadAll(moduleDir?: string) {
        moduleDir = moduleDir || this.moduleDirConfigEntry!.get();
        this.logger.info("Loading all modules");
        await ensureDir(moduleDir);
        const modules = await readdir(moduleDir);
        for (const filename of modules) {
            let path = resolve(moduleDir, filename);
            const stats = await stat(path);
            if (stats.isDirectory()) {
                // Module is a directory, use index.js
                const oldPath = path;
                path = resolve(path, "index.js");
                try {
                    stat(path);
                } catch {
                    // File doesn't exist or some other error, skip anyway
                    this.logger.warn(`Invalid module directory ${oldPath} found without accessible index.js`);
                    continue;
                }
            }
            // Skip files that aren't javascript
            if (!path.endsWith(".js")) { continue; }
            try {
                const loaded = require(path).default;
                if (!Module.isPrototypeOf(loaded)) {
                    this.logger.warn(`Skipping a non-module file "${filename}"`);
                    continue;
                }
                await this.loadModule(loaded);
            } catch (error) {
                this.logger.error(`Error while loading module ${filename}: ${error.stack || error}`);
            }
        }
        this.emit("loaded");
    }

    public registerConfig(config: Config) {
        this.moduleDirConfigEntry = new StringConfigEntry({
            description: "The directory for modules",
            name: "moduleDirectory",
        }, "modules");
        this.configEntry = new ConfigEntryGroup({
            description: "Modules configuration",
            name: "modules",
        }, [ this.moduleDirConfigEntry ]);
        config.register(this.configEntry);
    }
}
