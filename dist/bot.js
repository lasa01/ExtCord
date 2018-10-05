"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const winston_1 = __importDefault(require("winston"));
const config_1 = __importDefault(require("./config/config"));
const entry_1 = __importDefault(require("./config/entry"));
const entrygroup_1 = __importDefault(require("./config/entrygroup"));
const modules_1 = __importDefault(require("./modules/modules"));
class Bot {
    constructor(configFile, logger) {
        this.logger = logger;
        this.config = new config_1.default(logger);
        this.modules = new modules_1.default(logger);
        this.configEntries = {};
        this.configFile = configFile;
        this.registerConfigs();
        this.config.load(0, configFile);
    }
    registerConfigs() {
        const loggerConfigs = {
            file: new entry_1.default({
                description: "Logfile filename",
                name: "file",
            }, "bot.log"),
            format: new entry_1.default({
                description: "Logger format",
                name: "format",
            }, "cli"),
            loglevel: new entry_1.default({
                description: "Logfile loglevel",
                name: "loglevel",
            }, "info"),
        };
        this.configEntries.loggerConfig = new entrygroup_1.default({
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
                    new winston_1.default.transports.Console(),
                    new winston_1.default.transports.File({ filename: loggerConfigs.file.get() }),
                ],
            });
        });
        const generalConfigs = {
            moduleDirectory: new entry_1.default({
                description: "The directory to load modules from",
                name: "moduleDirectory",
            }, "./modules"),
        };
        this.configEntries.generalConfig = new entrygroup_1.default({
            description: "General configuration",
            name: "general",
        }, Object.values(generalConfigs));
        this.config.register(this.configEntries.generalConfig);
        const clientConfigs = {
            messageCacheLifetime: new entry_1.default({
                description: "How long a message should stay in the cache (in seconds, 0 for forever)",
                name: "messageCacheLifetime",
            }, 0),
            messageCacheMaxSize: new entry_1.default({
                description: "Maximum number of messages to cache per channel (-1 or Infinity for unlimited)",
                name: "messageCacheMaxSize",
            }, 200),
            messageCacheSweepInterval: new entry_1.default({
                description: "How frequently to remove messages from the cache (in seconds, 0 for never)",
                name: "messageCacheSweepInterval",
            }, 0),
            token: new entry_1.default({
                description: "Discord login token",
                name: "token",
            }, ""),
        };
        this.configEntries.clientConfig = new entrygroup_1.default({
            description: "Discord client configuration",
            loadStage: 0,
            name: "client",
        }, Object.values(clientConfigs));
        this.config.register(this.configEntries.clientConfig);
        this.config.on("loaded", async (stage) => {
            if (stage !== 0) {
                return;
            }
            this.client = new discord_js_1.default.Client({
                messageCacheLifetime: clientConfigs.messageCacheLifetime.get(),
                messageCacheMaxSize: clientConfigs.messageCacheMaxSize.get(),
                messageSweepInterval: clientConfigs.messageCacheSweepInterval.get(),
            });
            await this.modules.loadAll(generalConfigs.moduleDirectory.get());
            this.client.login(clientConfigs.token.get());
        });
    }
}
exports.default = Bot;
//# sourceMappingURL=bot.js.map