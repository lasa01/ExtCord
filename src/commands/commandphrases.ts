import { MessagePhrase } from "../language/phrase/messagephrase";
import { TemplatePhrase } from "../language/phrase/templatephrase";

export const CommandPhrases = {
    availableSubcommands: new MessagePhrase(
        {
            description: "This is shown when a command group is called without a subcommand",
            name: "availableSubcommands",
        },
        "The following subcommands are available: `{subcommands}`.",
        {
            description: "The following subcommands are available: `{subcommands}`.",
            timestamp: false,
            title: "Available subcommands",
        },
        {
            subcommands: "A list of available subcommands",
        },
    ),
    executionError: new MessagePhrase(
        {
            description: "This is shown when an unexpected error occurs while executing a command",
            name: "executionError",
        },
        "The execution of the command failed because of an unexpected error.\n```{error}```",
        {
            description: "The execution of the command failed.\n```{error}```",
            timestamp: false,
            title: "An unexpected error occured",
        },
        {
            error: "The error that occured",
        },
    ),
    invalidArgument: new MessagePhrase(
        {
            description: "This is shown when an invalid argument is supplied to a command",
            name: "invalidArgument",
        },
        "The argument supplied for {argument} (`{supplied}`) is invalid.\n{reason}",
        {
            description: "The argument supplied for {argument} (`{supplied}`) is invalid.\n{reason}",
            timestamp: false,
            title: "Argument parsing failed",
        },
        {
            argument: "The name of the invalid argument",
            reason: "Why the argument is invalid",
            supplied: "The argument that was supplied",
        },
    ),
    invalidCommand: new MessagePhrase(
        {
            description: "This is shown when an invalid command is called",
            name: "invalidCommand",
        },
        "The command you are trying to call (`{command}`) doesn't exist.",
        {
            description: "The command you are trying to call (`{command}`) doesn't exist.",
            timestamp: false,
            title: "Invalid command",
        },
        {
            command: "The command that was called",
        },
    ),
    invalidIntegerArgument: new TemplatePhrase(
        {
            description: "This is shown when a supplied integer argument is not an integer",
            name: "invalidIntegerArgument",
        },
        "`{argument}` is not a valid integer.",
        {
            argument: "The supplied argument",
        },
    ),
    invalidNumberArgument: new TemplatePhrase(
        {
            description: "This is shown when a supplied float argument is not a valid float",
            name: "invalidNumberArgument",
        },
        "`{argument}` is not a valid number.",
        {
            argument: "The supplied argument",
        },
    ),
    invalidSubcommand: new MessagePhrase(
        {
            description: "This is shown when an invalid subcommand is called",
            name: "invalidSubcommand",
        },
        "The subcommand you are trying to call (`{subcommand}`) doesn't exist.",
        {
            description: "The subcommand you are trying to call (`{subcommand}`) doesn't exist.",
            timestamp: false,
            title: "Invalid subcommand",
        },
        {
            subcommand: "The subcommand that is called",
        },
    ),
    noPermission: new MessagePhrase(
        {
            description: "This is shown when an user is trying to do something they're not allowed to",
            name: "noPermission",
        },
        "You are not allowed to do that.\nYou don't have the required permission `{permission}.",
        {
            description: "You are not allowed to do that.\nYou don't have the required permission `{permission}.`",
            timestamp: false,
            title: "Insufficient permissions",
        },
        {
            permission: "The permission required to do the thing",
        },
    ),
    tooBigArgument: new TemplatePhrase(
        {
            description: "This is shown when a supplied argument is too big.",
            name: "tooBigArgument",
        },
        "`{argument}` is too big. It should be no more than {max}.",
        {
            argument: "The supplied argument",
            max: "The maximum of the argument",
        },
    ),
    tooFewArguments: new MessagePhrase(
        {
            description: "This is shown when a command is supplied with too few arguments",
            name: "tooFewArguments",
        },
        "Too few arguments. You supplied only {supplied} arguments, while the command requires {required}.",
        {
            description: "You supplied only {supplied} arguments, while the command requires {required}.",
            timestamp: false,
            title: "Too few arguments",
        },
        {
            required: "The amount of required arguments",
            supplied: "The amount of supplied arguments",
        },
    ),
    tooManyArguments: new MessagePhrase(
        {
            description: "This is shown when a command is supplied with too many arguments",
            name: "tooManyArguments",
        },
        "Too many arguments. You supplied {supplied} arguments, while the command requires only {required}.",
        {
            description: "You supplied {supplied} arguments, while the command requires only {required}.",
            timestamp: false,
            title: "Too many arguments",
        },
        {
            required: "The amount of required arguments",
            supplied: "The amount of supplied arguments",
        },
    ),
    tooSmallArgument: new TemplatePhrase(
        {
            description: "This is shown when a supplied argument is too small.",
            name: "tooSmallArgument",
        },
        "`{argument}` is too small. It should be at least {min}.",
        {
            min: "The minimum of the argument",
        },
    ),
};
