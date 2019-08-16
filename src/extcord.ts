import Yargs = require("yargs");

import { Bot } from "./Bot";
import { Logger } from "./util/Logger";
import { Serializer } from "./util/Serializer";

Yargs.usage("Usage: $0 <command> [options]")
    .count("verbose")
    .alias("v", "verbose")
    .option("interactive", {
        alias: "i",
        default: false,
    })
    .command(["run [configFile]", "$0"], "run the bot",
    (yargs) => yargs.positional("configFile", {
        default: "config" + Serializer.extension,
        describe: "config file to use",
    }),
    (argv) => {
        Logger.initialize(argv.verbose);
        const bot = new Bot(argv.configFile);
        bot.run().then(() => {
            Logger.info("Bot running");
        }).catch((err) => {
            Logger.error(err.stack || err);
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
        (argv) => { throw new Error("Not implemented"); })
    .demandCommand()
    .parse();
