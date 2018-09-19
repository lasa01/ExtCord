"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const yargs_1 = __importDefault(require("yargs"));
const bot_1 = __importDefault(require("./bot"));
const pkg = JSON.parse(fs_1.default.readFileSync("package.json", "utf8"));
const args = yargs_1.default.usage("Usage: $0 <command> [options]")
    .command(["run [configFile]", "$0"], "run the bot", (yargs) => yargs.positional("configFile", { describe: "config file to use", default: "config.json5" }), (argv) => { const bot = new bot_1.default(argv.configFile); })
    .demandCommand()
    .count("verbose")
    .alias("v", "verbose")
    .argv;
//# sourceMappingURL=index.js.map