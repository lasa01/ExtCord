import { DynamicFieldMessagePhrase } from "../language/phrase/DynamicFieldMessagePhrase";
import { MessagePhrase } from "../language/phrase/MessagePhrase";
import { SimplePhrase } from "../language/phrase/SimplePhrase";
import { TemplatePhrase } from "../language/phrase/TemplatePhrase";

export const CommandPhrases = {
    argumentUsage: new TemplatePhrase(
        {
            description: "The template for argument usage instructions",
            name: "argumentUsage",
        },
        "`{argument}`: {description}",
        {
            argument: "The name of the argument",
            description: "The description of the argument",
        },
    ),
    commandGroupUsage: new DynamicFieldMessagePhrase(
        {
            description: "The template for command group usage instructions",
            name: "commandGroupUsage",
        },
        "Available subcommands:",
        {
            timestamp: false,
            title: "Available subcommands",
        },
        "{description}: {usage}",
        {
            inline: true,
            name: "{description}",
            value: "{usage}",
        },
        {},
        {
            description: "The description of the subcommand",
            usage: "The (short) usage for the subcommand",
        },
    ),
    commandUsage: new TemplatePhrase(
        {
            description: "The template for command usage instructions",
            name: "commandUsage",
        },
        "{description}\n`{command} {arguments}`\n{argumentsUsage}",
        {
            arguments: "List of the command's argument names",
            argumentsUsage: "The usage instructions of each argument",
            command: "The name of the command",
            description: "The description of the command",
        },
    ),
    commandUsageShort: new TemplatePhrase(
        {
            description: "The template for short command usage instructions",
            name: "commandUsageShort",
        },
        "`{command} {arguments}`",
        {
            arguments: "List of the command's argument names",
            command: "The name of the command",
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
        "The argument supplied for {argument} (`{supplied}`) is invalid.\n" +
        "{reason}\nUsage: {commandUsage}\n{argumentUsage}",
        {
            description: "The argument supplied for {argument} (`{supplied}`) is invalid:\n{reason}",
            fields: [{
                inline: false,
                name: "Usage",
                value: "{commandUsage}\n{argumentUsage}",
            }],
            timestamp: false,
            title: "Argument parsing failed",
        },
        {
            argument: "The name of the invalid argument",
            argumentUsage: "The usage instructions of the invalid argument",
            commandUsage: "The (short) usage instructions of the command",
            reason: "Why the argument is invalid",
            supplied: "The argument that was supplied",
        },
    ),
    invalidCommand: new MessagePhrase(
        {
            description: "This is shown when an invalid command is called",
            name: "invalidCommand",
        },
        "The command `{command}` doesn't exist.",
        {
            description: "The command `{command}` doesn't exist.",
            timestamp: false,
            title: "Invalid command",
        },
        {
            command: "The command that was called",
        },
    ),
    invalidIntegerArgument: new SimplePhrase(
        {
            description: "This is shown when a supplied integer argument is not an integer",
            name: "invalidIntegerArgument",
        },
        "The argument is not a valid integer.",
    ),
    invalidNumberArgument: new SimplePhrase(
        {
            description: "This is shown when a supplied float argument is not a valid float",
            name: "invalidNumberArgument",
        },
        "The argument is not a valid number.",
    ),
    invalidSubcommand: new MessagePhrase(
        {
            description: "This is shown when an invalid subcommand is called",
            name: "invalidSubcommand",
        },
        "The subcommand `{subcommand}` doesn't exist.",
        {
            description: "The subcommand `{subcommand}` doesn't exist.",
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
        "The argument is too big. It should be no more than {max}.",
        {
            max: "The maximum of the argument",
        },
    ),
    tooFewArguments: new MessagePhrase(
        {
            description: "This is shown when a command is supplied with too few arguments",
            name: "tooFewArguments",
        },
        "Too few arguments. You supplied only {supplied} arguments, while the command requires {required}.\n" +
        "Usage: {commandUsage}",
        {
            description: "You supplied only {supplied} arguments, while the command requires {required}.\n" +
            "Usage: {commandUsage}",
            timestamp: false,
            title: "Too few arguments",
        },
        {
            commandUsage: "The (short) usage instructions of the command",
            required: "The amount of required arguments",
            supplied: "The amount of supplied arguments",
        },
    ),
    tooManyArguments: new MessagePhrase(
        {
            description: "This is shown when a command is supplied with too many arguments",
            name: "tooManyArguments",
        },
        "Too many arguments. You supplied {supplied} arguments, while the command requires only {required}.\n" +
        "Usage: {commandUsage}",
        {
            description: "You supplied {supplied} arguments, while the command requires only {required}.\n" +
            "Usage: {commandUsage}",
            timestamp: false,
            title: "Too many arguments",
        },
        {
            commandUsage: "The (short) usage instructions of the command",
            required: "The amount of required arguments",
            supplied: "The amount of supplied arguments",
        },
    ),
    tooSmallArgument: new TemplatePhrase(
        {
            description: "This is shown when a supplied argument is too small.",
            name: "tooSmallArgument",
        },
        "The argument is too small. It should be at least {min}.",
        {
            min: "The minimum of the argument",
        },
    ),
};
