import Discord from "discord.js";
import Winston from "winston";
import Yargs from "yargs";

import Config from "./config/config";
import Modules from "./modules/modules";

export default class Bot {
    public logger: Winston.Logger;
    public client: Discord.Client;
    public config: Config;
    public modules: Modules;

    constructor(configFile: string) {
        this.config = new Config(this, configFile);
        this.logger = Winston.createLogger({
            format: Winston.format.cli(),
            transports: [
                new Winston.transports.Console(),
                new Winston.transports.File({ filename: "bot.log" }),
            ],
        });
        this.modules = new Modules(this);
        this.client = new Discord.Client();
    }
}
