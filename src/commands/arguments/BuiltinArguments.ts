import { SubcommandArgument } from "./SubcommandArgument";

/**
 * Built-in arguments used in other places
 * @category Command Argument
 */
export const BuiltInArguments = {
    /** Built-in argument for command group subcommands */
    subcommand: new SubcommandArgument({
        description: "the subcommand to call",
        name: "subcommand",
    }),
};
