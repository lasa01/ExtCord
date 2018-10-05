import Discord from "discord.js";
import Winston from "winston";

import Config from "./config/config";
import ConfigEntry from "./config/entry";
import ConfigEntryGroup from "./config/entrygroup";
import Modules from "./modules/modules";

export default class Bot {
    public logger: Winston.Logger;
    public client?: Discord.Client;
    public config: Config;
    public configFile: string;
    public modules: Modules;
    private configEntries:
        {loggerConfig?: ConfigEntryGroup, clientConfig?: ConfigEntryGroup, generalConfig?: ConfigEntryGroup};

    constructor(configFile: string, logger: Winston.Logger) {
        this.logger = logger;
        this.config = new Config(logger);
        this.modules = new Modules(logger);
        this.configEntries = {};
        this.configFile = configFile;
        this.registerConfigs();
        this.config.load(0, configFile);
    }

    private registerConfigs() {
        const loggerConfigs = {
            file: new ConfigEntry({
                description: "Logfile filename",
                name: "file",
            }, "bot.log"),
            format: new ConfigEntry({
                description: "Logger format",
                name: "format",
            }, "cli"),
            loglevel: new ConfigEntry({
                description: "Logfile loglevel",
                name: "loglevel",
            }, "info"),
        };
        this.configEntries.loggerConfig = new ConfigEntryGroup({
            description: "Winston logger configuration",
            loadStage: 0,
            name: "logger",
        }, Object.values(loggerConfigs));
        this.config.register(this.configEntries.loggerConfig);
        this.configEntries.loggerConfig.once("loaded", () => {
            this.logger.configure({
                // format: ?
                level: loggerConfigs.loglevel.get(),
                transports: [
                    new Winston.transports.Console(),
                    new Winston.transports.File( { filename: loggerConfigs.file.get() } ),
                ],
            });
        });

        const generalConfigs = {
            moduleDirectory: new ConfigEntry({
                description: "The directory to load modules from",
                name: "moduleDirectory",
            }, "./modules"),
        };
        this.configEntries.generalConfig = new ConfigEntryGroup({
            description: "General configuration",
            name: "general",
        }, Object.values(generalConfigs));
        this.config.register(this.configEntries.generalConfig);

        const clientConfigs = {
            messageCacheLifetime: new ConfigEntry({
                description: "How long a message should stay in the cache (in seconds, 0 for forever)",
                name: "messageCacheLifetime",
            }, 0),
            messageCacheMaxSize: new ConfigEntry({
                description: "Maximum number of messages to cache per channel (-1 or Infinity for unlimited)",
                name: "messageCacheMaxSize",
            }, 200),
            messageCacheSweepInterval: new ConfigEntry({
                description: "How frequently to remove messages from the cache (in seconds, 0 for never)",
                name: "messageCacheSweepInterval",
            }, 0),
            token: new ConfigEntry({
                description: "Discord login token",
                name: "token",
            }, ""),
        };
        this.configEntries.clientConfig = new ConfigEntryGroup({
            description: "Discord client configuration",
            loadStage: 0,
            name: "client",
        }, Object.values(clientConfigs));
        this.config.register(this.configEntries.clientConfig);

        this.config.on("loaded", async (stage) => {
            if (stage !== 0) { return; }
            this.client = new Discord.Client({
                messageCacheLifetime: clientConfigs.messageCacheLifetime.get(),
                messageCacheMaxSize: clientConfigs.messageCacheMaxSize.get(),
                messageSweepInterval: clientConfigs.messageCacheSweepInterval.get(),
            });
            await this.modules.loadAll(generalConfigs.moduleDirectory.get());
            this.client.login(clientConfigs.token.get());
        });
    }
}
