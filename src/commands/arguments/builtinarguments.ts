import { StringArgument } from "./stringargument";

export const BuiltInArguments = {
    subCommand: new StringArgument({
        description: "the subcommand to call",
        name: "subcommand",
    }),
};
