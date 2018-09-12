import Winston from 'winston';
import Discord from 'discord.js';

class Bot {
    logger: Winston.Logger;
    client: Discord.Client;

    constructor() {
        this.logger = Winston.createLogger({
            format: Winston.format.cli(),
            transports: [
                new Winston.transports.Console(),
                new Winston.transports.File({ filename: 'bot.log' })
            ]
        });

        this.client = new Discord.Client();
    }
}

new Bot();