import { StringArgument } from "./StringArgument";

export const BuiltInArguments = {
    subcommand: new StringArgument({
            description: "the subcommand to call",
            name: "subcommand",
        }, true),
    subcommandArguments: new StringArgument({
            description: "arguments for the subcommand",
            name: "arguments",
    }, true, true),
};
