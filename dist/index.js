"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const yargs_1 = __importDefault(require("yargs"));
const bot_1 = __importDefault(require("./bot"));
const configure_1 = __importDefault(require("./configure"));
const args = yargs_1.default.usage("Usage: $0 <command> [options]")
    .command(["run [configFile]", "$0"], "run the bot", (yargs) => yargs.positional("configFile", { describe: "config file to use", default: "config.json5" }), (argv) => { const bot = new bot_1.default(argv.configFile, initLogger(argv.verbose)); })
    .command(["configure [configFile]", "config"], "configure the bot", (yargs) => yargs.positional("configFile", { describe: "config file to use", default: "config.json5" }), (argv) => { const configure = new configure_1.default(argv.configFile); })
    .demandCommand()
    .count("verbose")
    .alias("v", "verbose")
    .argv;
const levels = {
    0: "error",
    1: "warn",
    2: "info",
    3: "verbose",
    4: "debug",
    5: "silly",
};
function initLogger(verbose) {
    return winston_1.default.createLogger({
        format: winston_1.default.format.cli(),
        level: levels[2 + verbose],
        transports: [
            new winston_1.default.transports.Console(),
        ],
    });
}
//# sourceMappingURL=index.js.map