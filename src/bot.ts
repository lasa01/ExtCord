import Discord from "discord.js";
import Winston from "winston";

class Bot {
    public logger: Winston.Logger;
    public client: Discord.Client;

    constructor() {
        this.logger = Winston.createLogger({
            format: Winston.format.cli(),
            transports: [
                new Winston.transports.Console(),
                new Winston.transports.File({ filename: "bot.log" }),
            ],
        });

        this.client = new Discord.Client();
    }
}

const bot = new Bot();
