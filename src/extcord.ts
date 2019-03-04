import { createLogger, format, Logger, transports } from "winston";
import Yargs = require("yargs");

import { Bot } from "./bot";
import { Configure } from "./configure";
import { Serializer } from "./util/serializer";

/**
 * @ignore
 */
const args = Yargs.usage("Usage: $0 <command> [options]")
    .command(["run [configFile]", "$0"], "run the bot",
        (yargs) => yargs.positional("configFile", {
            default: "config" + Serializer.extension,
            describe: "config file to use",
        }),
        (argv) => {
            const logger = initLogger(argv.verbose as number);
            const bot = new Bot(argv.configFile, logger);
            bot.run().then(() => {
                logger.info("Bot running");
            }).catch((err) => {
                logger.error(err.stack || err);
                bot.stop();
            });
            if (argv.interactive) {
                bot.setInteractive(process.stdin);
            }
        })
    .command(["configure [configFile]", "config"], "configure the bot",
        (yargs) => yargs.positional("configFile", {
            default: "config" + Serializer.extension,
            describe: "config file to use",
        }),
        (argv) => { const configure = new Configure(argv.configFile); })
    .demandCommand()
    .count("verbose")
    .alias("v", "verbose")
    .option("interactive", {
        alias: "i",
        default: false,
    })
    .argv;

/**
 * @ignore
 */
function initLogger(verbose: number): Logger {
    const levels: { [key: number]: string } = {
        0: "error",
        1: "warn",
        2: "info",
        3: "verbose",
        4: "debug",
        5: "silly",
    };
    return createLogger({
        format: format.combine(format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }), format.printf((info) => `[${info.timestamp}] [${info.level}]: ${info.message}`)),
        level: levels[2 + verbose] || "silly",
        transports: [
            new transports.Console(),
        ],
    });
}
