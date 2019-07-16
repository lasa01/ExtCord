import { EventEmitter } from "events";
import { createInterface, ReadLine } from "readline";

import { Client } from "discord.js";
import { transports } from "winston";

import { Commands } from "./commands/commands";
import { Config } from "./config/config";
import { ConfigEntryGroup } from "./config/entry/entrygroup";
import { NumberConfigEntry } from "./config/entry/numberentry";
import { StringConfigEntry } from "./config/entry/stringentry";
import { Database } from "./database/database";
import { Languages } from "./language/languages";
import { Modules } from "./modules/modules";
import { Permissions } from "./permissions/permissions";
import { logger } from "./util/logger";

// Event definitions
// tslint:disable-next-line:interface-name
export interface Bot {
    /** @event */
    addListener(event: "ready" | "stop", listener: () => void): this;

    /** @event */
    emit(event: "ready" | "stop"): boolean;

    /** @event */
    on(event: "ready" | "stop", listener: () => void): this;

    /** @event */
    once(event: "ready" | "stop", listener: () => void): this;

    /** @event */
    prependListener(event: "ready" | "stop", listener: () => void): this;

    /** @event */
    prependOnceListener(event: "ready" | "stop", listener: () => void): this;
}

export class Bot extends EventEmitter {
    public readline?: ReadLine;
    public client?: Client;
    public config: Config;
    public database: Database;
    public permissions: Permissions;
    public commands: Commands;
    public languages: Languages;
    public modules: Modules;
    private configEntries: {
        loggerGroup?: ConfigEntryGroup, clientGroup?: ConfigEntryGroup,
        logger: {
            file: StringConfigEntry,
            loglevel: StringConfigEntry,
        },
        client: {
            messageCacheLifetime: NumberConfigEntry,
            messageCacheMaxSize: NumberConfigEntry,
            messageCacheSweepInterval: NumberConfigEntry,
            token: StringConfigEntry,
        },
    };

    constructor(configFile: string) {
        super();
        this.config = new Config(configFile);
        this.configEntries = {
            client: {
                messageCacheLifetime: new NumberConfigEntry({
                    description: "How long a message should stay in the cache (in seconds, 0 for forever)",
                    name: "messageCacheLifetime",
                }, 0),
                messageCacheMaxSize: new NumberConfigEntry({
                    description: "Maximum number of messages to cache per channel (-1 for unlimited)",
                    name: "messageCacheMaxSize",
                }, 200),
                messageCacheSweepInterval: new NumberConfigEntry({
                    description: "How frequently to remove messages from the cache (in seconds, 0 for never)",
                    name: "messageCacheSweepInterval",
                }, 0),
                token: new StringConfigEntry({
                    description: "Discord login token",
                    name: "token",
                }, ""),
            },
            logger: {
                file: new StringConfigEntry({
                    description: "Log filename",
                    name: "file",
                }, "bot.log"),
                loglevel: new StringConfigEntry({
                    description: "Log level",
                    name: "loglevel",
                }, "info"),
            },
        };
        this.configEntries.loggerGroup = new ConfigEntryGroup({
            description: "Winston logger configuration",
            loadStage: 0,
            name: "logger",
        }, Object.values(this.configEntries.logger));
        this.configEntries.clientGroup = new ConfigEntryGroup({
            description: "Discord client configuration",
            name: "client",
        }, Object.values(this.configEntries.client));
        this.config.register(this.configEntries.loggerGroup);
        this.config.register(this.configEntries.clientGroup);
        this.database = new Database();
        this.database.registerConfig(this.config);
        Config.registerDatabase(this.database);
        this.permissions = new Permissions(this.database);
        this.languages = new Languages();
        this.languages.registerConfig(this.config, this.database);
        this.commands = new Commands(this);
        this.commands.registerConfig(this.config, this.database);
        this.modules = new Modules(this);
        this.modules.registerConfig(this.config);
    }

    public async run() {
        logger.debug(`Processor architecture: ${process.arch}`);
        logger.debug(`Command line: ${process.argv}`);
        logger.debug(`Working directory: ${process.cwd()}`);
        logger.debug(`Platform: ${process.platform}`);
        logger.debug(`Node.js version: ${process.version}`);
        logger.verbose("Loading config");
        while (this.config.hasNext()) {
            const stage = await this.config.loadNext();
            if (stage === 0) {
                logger.debug("Reconfiguring logger");
                logger.get().configure({
                    level: logger.get().level === "info" ?
                        this.configEntries.logger.loglevel.get() : logger.get().level,
                    transports: [
                        new transports.Console(),
                        new transports.File( { filename: this.configEntries.logger.file.get() } ),
                    ],
                });
                await this.commands.registerCommands();
                await this.modules.loadAll();
                this.commands.registerPermissions(this.permissions);
                this.commands.registerLanguages();
                this.permissions.registerConfig(this.config);
                this.permissions.registerLanguages(this.languages);
                await this.languages.loadAll();
                logger.debug(this.permissions.getStatus());
                logger.debug(this.commands.getStatus());
                logger.debug(this.languages.getStatus());
            } else if (stage === 1) {
                await this.database.connect();
                this.client = new Client({
                    messageCacheLifetime: this.configEntries.client.messageCacheLifetime.get(),
                    messageCacheMaxSize: this.configEntries.client.messageCacheMaxSize.get(),
                    messageSweepInterval: this.configEntries.client.messageCacheSweepInterval.get(),
                });
                logger.info("Connecting to Discord");
                await this.client.login(this.configEntries.client.token.get());
                this.emit("ready");
                this.client.on("message", async (message) => {
                    await this.commands.message(message);
                });
            }
        }
    }

    public setInteractive(input: NodeJS.ReadableStream) {
        this.readline = createInterface({
            input,
        });
        this.readline.on("line", (line: string) => {
            this.input(line.trim());
        });
        this.readline.on("SIGINT", () => {
            this.stop();
        });
    }

    public input(input: string) {
        if (input === "stop") {
            this.stop();
        }
    }

    public async stop() {
        logger.info("Bot stopping");
        this.emit("stop");
        await this.database.stop();
        if (this.client) {
            await this.client.destroy();
            logger.verbose("Client disconnected");
        }
        if (this.readline) {
            this.readline.close();
        }
    }
}
