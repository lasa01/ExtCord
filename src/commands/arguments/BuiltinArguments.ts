import { StringArgument } from "./StringArgument";

/**
 * Built-in arguments used in other places
 * @category Command Argument
 */
export const BuiltInArguments = {
    /** Built-in argument for command group subcommands */
    subcommand: new StringArgument({
            description: "the subcommand to call",
            name: "subcommand",
        }, true),
    /** Built-in argument for command group subcommand arguments */
    subcommandArguments: new StringArgument({
            description: "arguments for the subcommand",
            name: "arguments",
    }, true, true),
};
