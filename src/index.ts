import Winston from "winston";
import Yargs from "yargs";

import Bot from "./bot";
import Configure from "./configure";

const args = Yargs.usage("Usage: $0 <command> [options]")
    .command(["run [configFile]", "$0"], "run the bot",
        (yargs) => yargs.positional("configFile", { describe: "config file to use", default: "config.hjson" }),
        (argv) => {
            const logger = initLogger(argv.verbose);
            const bot = new Bot(argv.configFile, logger);
            bot.run().then(() => {
                logger.info("Bot running");
            }).catch((err) => {
                logger.error(err);
                bot.stop();
            });
            if (argv.interactive) {
                bot.setInteractive(process.stdin);
            }
        })
    .command(["configure [configFile]", "config"], "configure the bot",
        (yargs) => yargs.positional("configFile", { describe: "config file to use", default: "config.hjson" }),
        (argv) => { const configure = new Configure(argv.configFile); })
    .demandCommand()
    .count("verbose")
    .alias("v", "verbose")
    .option("interactive", {
        alias: "i",
        default: false,
    })
    .argv;

function initLogger(verbose: number): Winston.Logger {
    const levels: { [key: number]: string } = {
        0: "error",
        1: "warn",
        2: "info",
        3: "verbose",
        4: "debug",
        5: "silly",
    };
    return Winston.createLogger({
        format: Winston.format.combine(Winston.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }), Winston.format.printf((info) => `[${info.timestamp}] [${info.level}]: ${info.message}`)),
        level: levels[2 + verbose] || "silly",
        transports: [
            new Winston.transports.Console(),
        ],
    });
}
