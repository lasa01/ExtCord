import Yargs = require("yargs");

import { Bot } from "./bot";
import { Configure } from "./configure";
import { logger } from "./util/logger";
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
            logger.initialize(argv.verbose as number);
            const bot = new Bot(argv.configFile);
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
