import { EventEmitter } from "events";
import { createInterface, ReadLine } from "readline";

import { Client } from "discord.js";
import { transports } from "winston";

import { Commands } from "./commands/Commands";
import { Config } from "./config/Config";
import { ConfigEntryGroup } from "./config/entry/ConfigEntryGroup";
import { NumberConfigEntry } from "./config/entry/NumberConfigEntry";
import { StringConfigEntry } from "./config/entry/StringConfigEntry";
import { Database } from "./database/Database";
import { Languages } from "./language/Languages";
import { Modules } from "./modules/Modules";
import { Permissions } from "./permissions/Permissions";
import { Logger } from "./util/Logger";

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
        this.config.registerEntry(this.configEntries.loggerGroup);
        this.config.registerEntry(this.configEntries.clientGroup);
        this.database = new Database();
        this.database.registerConfig(this.config);
        Config.registerDatabase(this.database);
        this.permissions = new Permissions(this.database);
        this.languages = new Languages();
        this.languages.registerConfig(this.config, this.database);
        this.commands = new Commands(this);
        this.commands.registerConfig();
        this.commands.registerDatabase();
        this.modules = new Modules(this);
        this.modules.registerConfig();
    }

    public async run() {
        Logger.debug(`Processor architecture: ${process.arch}`);
        Logger.debug(`Command line: ${process.argv}`);
        Logger.debug(`Working directory: ${process.cwd()}`);
        Logger.debug(`Platform: ${process.platform}`);
        Logger.debug(`Node.js version: ${process.version}`);
        Logger.verbose("Loading config");
        while (this.config.hasNext()) {
            const stage = await this.config.loadNext();
            if (stage === 0) {
                Logger.debug("Reconfiguring logger");
                Logger.get().configure({
                    level: Logger.get().level === "info" ?
                        this.configEntries.logger.loglevel.get() : Logger.get().level,
                    transports: [
                        new transports.Console(),
                        new transports.File( { filename: this.configEntries.logger.file.get() } ),
                    ],
                });
                await this.commands.registerCommands();
                await this.modules.loadAll();
                this.commands.registerPermissions();
                this.commands.registerLanguages();
                this.permissions.registerConfig(this.config);
                this.permissions.registerLanguages(this.languages);
                await this.permissions.loadAllPrivileges();
                await this.languages.loadAll();
                Logger.debug(this.permissions.getStatus());
                Logger.debug(this.commands.getStatus());
                Logger.debug(this.languages.getStatus());
            } else if (stage === 1) {
                await this.database.connect();
                this.client = new Client({
                    messageCacheLifetime: this.configEntries.client.messageCacheLifetime.get(),
                    messageCacheMaxSize: this.configEntries.client.messageCacheMaxSize.get(),
                    messageSweepInterval: this.configEntries.client.messageCacheSweepInterval.get(),
                });
                Logger.info("Connecting to Discord");
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
        Logger.info("Bot stopping");
        this.emit("stop");
        await this.database.stop();
        if (this.client) {
            await this.client.destroy();
            Logger.verbose("Client disconnected");
        }
        if (this.readline) {
            this.readline.close();
        }
    }
}
