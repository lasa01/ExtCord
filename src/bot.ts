import Discord from "discord.js";
import Winston from "winston";
import Yargs from "yargs";

import Config from "./config/config";
import ConfigEntry from "./config/entry";
import ConfigEntryGroup from "./config/entrygroup";
import Modules from "./modules/modules";

export default class Bot {
    public logger: Winston.Logger;
    public client: Discord.Client;
    public config: Config;
    public modules: Modules;

    constructor(configFile: string, logger: Winston.Logger) {
        this.config = new Config(this, configFile);
        this.logger = logger;
        this.modules = new Modules(this);
        this.client = new Discord.Client();
    }

    private configureLogger() {
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
        const loggerConfig = new ConfigEntryGroup({
            description: "Winston logger configuration",
            loadStage: 0,
            name: "logger",
        }, Object.values(loggerConfigs));
        this.config.register(loggerConfig);

        loggerConfig.once("loaded", () => {
            this.logger.configure({
                // TODO: make work: format: Winston.format[loggerConfigs.format.get()](),
                level: loggerConfigs.loglevel.get(),
                transports: [
                    new Winston.transports.Console(),
                    new Winston.transports.File( { filename: loggerConfigs.file.get() } ),
                ],
            });
        });
    }
}
