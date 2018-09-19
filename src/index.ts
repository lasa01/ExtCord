import FS from "fs";
import Yargs from "yargs";
import Bot from "./bot";

interface IPackage {
    readonly name: string;
    readonly version: string;
    readonly description: string;
    readonly main: string;
    readonly scripts: { readonly [name: string]: string };
    readonly repository: { readonly type: string; readonly url: string };
    readonly author: string;
    readonly license: string;
    readonly bugs: { readonly url: string };
    readonly homepage: string;
    readonly dependencies: { readonly [name: string]: string };
    readonly devDependencies?: { readonly [name: string]: string };
}

const pkg: IPackage = JSON.parse(FS.readFileSync("package.json", "utf8"));

const args = Yargs.usage("Usage: $0 <command> [options]")
    .command(["run [configFile]", "$0"], "run the bot",
        (yargs) => yargs.positional("configFile", { describe: "config file to use", default: "config.json5" }),
        (argv) => { const bot = new Bot(argv.configFile); })
    .demandCommand()
    .count("verbose")
    .alias("v", "verbose")
    .argv;
