import { spawn } from "child_process";
import { EventEmitter } from "events";
import { ensureDir, readdir, readFile, stat } from "fs-extra";
import { resolve } from "path";

import { Bot } from "../Bot";
import { ConfigEntryGroup } from "../config/entry/ConfigEntryGroup";
import { StringConfigEntry } from "../config/entry/StringConfigEntry";
import { Logger } from "../util/Logger";
import { Module } from "./Module";

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

/**
 * The bot's handler for module loading.
 * @category Module
 */
export class Modules extends EventEmitter {
    /** Config entry specifying the module directory. */
    public moduleDirConfigEntry: StringConfigEntry;
    private modules: Map<string, Module>;
    private bot: Bot;
    private configEntry?: ConfigEntryGroup;
    private dependencies: string[];

    /**
     * Creates a module handler.
     * @param bot The bot that uses the handler.
     */
    constructor(bot: Bot) {
        super();
        this.modules = new Map();
        this.bot = bot;
        this.moduleDirConfigEntry = new StringConfigEntry({
            description: "The directory for modules",
            name: "moduleDirectory",
        }, "modules");
        this.dependencies = [];
    }

    /**
     * Loads a single module from the specified class.
     * @param module The class of the module.
     */
    public async loadModule(module: new (bot: Bot) => Module) {
        const constructed = new module(this.bot);
        if (constructed.name === "" || constructed.author === "") {
            Logger.error("A module has an empty name and/or author");
            await constructed.unload();
            return;
        }
        if (this.modules.has(constructed.name)) {
            Logger.warn(`Module ${constructed.name} has a non-unique name, renaming...`);
            constructed.rename();
            if (this.modules.has(constructed.name)) {
                Logger.error("Renaming failed");
                await constructed.unload();
                return;
            }
        }
        this.modules.set(constructed.name, constructed);
        constructed.load();
        Logger.verbose(`Loaded module ${constructed.name}`);
    }

    /**
     * Loads all modules.
     * @param moduleDir Overrides the directory to load modules from.
     */
    public async loadAll(moduleDir?: string) {
        moduleDir = moduleDir ?? this.moduleDirConfigEntry.get();
        Logger.verbose("Loading all modules");
        await ensureDir(moduleDir);
        const modules = await readdir(moduleDir);
        const toRequire: string[] = [];
        for (const filename of modules) {
            let path = resolve(moduleDir, filename);
            const stats = await stat(path);
            if (stats.isDirectory()) {
                // Module is in a directory, use index.js as the entrypoint
                const oldPath = path;
                path = resolve(path, "index.js");
                try {
                    stat(path);
                } catch {
                    // File doesn't exist or some other error, skip anyway
                    Logger.warn(`Invalid module directory ${oldPath} found without accessible index.js`);
                    continue;
                }
            }
            // Skip files that aren't javascript
            if (!path.endsWith(".js")) { continue; }
            const fileContent = await readFile(path, "utf8");
            if (!fileContent.replace("\"use strict\";", "").trim().startsWith("// extcord module")) {
                Logger.warn(`Skipping a non-module file "${filename}"`);
                continue;
            }
            const dependencyLines = fileContent.split("\n").filter((line) => line.trim().startsWith("// requires"));
            for (const line of dependencyLines) {
                const dependencies = line.slice(11).split(" ");
                if (dependencies.length === 1 && dependencies[0] === "") {
                    continue;
                }
                for (const dependency of dependencies) {
                    this.addDependency(dependency);
                }
            }
            toRequire.push(path);
        }
        await this.installDependencies();
        for (const path of toRequire) {
            try {
                const loaded = require(path).default;
                if (!Module.isPrototypeOf(loaded)) {
                    Logger.error(`File "${path}" is marked as an extcord module but does not contain one`);
                    continue;
                }
                await this.loadModule(loaded);
            } catch (error) {
                Logger.error(`Error loading module ${path}: ${error.stack ?? error}`);
            }
        }
        this.emit("loaded");
    }

    /**
     * Adds a dependency to install with npm.
     * @param dependency The dependency string, in the format passed to npm install.
     */
    public addDependency(dependency: string) {
        this.dependencies.push(dependency);
    }

    /** Installs all added dependencies with npm. */
    public async installDependencies() {
        if (this.dependencies.length === 0) {
            return;
        }
        Logger.verbose("Installing dependencies");
        const installArgs = ["--quiet", "install", "--no-save", ...this.dependencies];
        const isWindows = process.platform.startsWith("win");
        const child = spawn(isWindows ? "npm.cmd" : "npm", installArgs);
        child.stdout.on("data", (msg) => Logger.verbose(msg.toString()));
        child.stderr.on("data", (msg) => Logger.error(msg.toString()));
        const exitCode = await new Promise<number>((res, rej) => {
            child.once("error", (err) => {
                rej(err);
            });
            child.once("close", (code, signal) => {
                res(code);
            });
        });
        if (exitCode !== 0) {
            throw new Error("Dependency installation failed with code " + exitCode);
        }
    }

    /** Registers the module handler's config entries. */
    public registerConfig() {
        this.configEntry = new ConfigEntryGroup({
            description: "Modules configuration",
            name: "modules",
        }, [ this.moduleDirConfigEntry ]);
        this.bot.config.registerEntry(this.configEntry);
    }
}
