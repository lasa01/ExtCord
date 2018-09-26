import Winston, { debug } from "winston";
import Yargs from "yargs";

import Bot from "./bot";
import Configure from "./configure";

const args = Yargs.usage("Usage: $0 <command> [options]")
    .command(["run [configFile]", "$0"], "run the bot",
        (yargs) => yargs.positional("configFile", { describe: "config file to use", default: "config.json5" }),
        (argv) => { const bot = new Bot(argv.configFile, initLogger(argv.verbose)); })
    .command(["configure [configFile]", "config"], "configure the bot",
        (yargs) => yargs.positional("configFile", { describe: "config file to use", default: "config.json5" }),
        (argv) => { const configure = new Configure(argv.configFile); })
    .demandCommand()
    .count("verbose")
    .alias("v", "verbose")
    .argv;

const levels: { [key: number]: string } = {
    0: "error",
    1: "warn",
    2: "info",
    3: "verbose",
    4: "debug",
    5: "silly",
};

function initLogger(verbose: number): Winston.Logger {
    return Winston.createLogger({
        format: Winston.format.cli(),
        level: levels[2 + verbose],
        transports: [
            new Winston.transports.Console(),
        ],
    });
}
