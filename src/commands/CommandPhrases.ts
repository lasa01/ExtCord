import { DynamicFieldMessagePhrase } from "../language/phrase/DynamicFieldMessagePhrase";
import { MessagePhrase } from "../language/phrase/MessagePhrase";
import { SimplePhrase } from "../language/phrase/SimplePhrase";
import { TemplatePhrase } from "../language/phrase/TemplatePhrase";

/**
 * Internal phrases used by command-related functions.
 * @category Command
 */
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
    botNoPermission: new MessagePhrase(
        {
            description: "This is shown when an user is trying to do something the bot is not allowed to",
            name: "botNoPermission",
        },
        "I can't do that.\nI don't have the required permissions `{permissions}`.",
        {
            description: "I can't do that.\nI don't have the required permissions `{permissions}`.",
            timestamp: false,
            title: "Insufficient bot permissions",
        },
        {
            permissions: "The permissions required to do the thing",
        },
    ),
    botNoSendPermission: new SimplePhrase(
        {
            description: "This is shown when the bot doesn't have permissions to send messages",
            name: "botNoSendPermission",
        },
        "Unfortunately, I don't have permission to send messages in that channel.",
    ),
    commandGroupHelp: new DynamicFieldMessagePhrase(
        {
            description: "The response template for help for a specific command group",
            name: "commandGroupHelp",
        },
        "Help for {command}\n{description}",
        {
            description: "{description}",
            timestamp: false,
            title: "Help for {command}",
        },
        "{description}: {usage}",
        {
            inline: true,
            name: "{description}",
            value: "{usage}",
        },
        {
            command: "The name of the parent command",
            description: "The description of the parent command",
        },
        {
            description: "The description of the subcommand",
            usage: "The (short) usage for the subcommand",
        },
    ),
    commandHelp: new MessagePhrase(
        {
            description: "The response template for help for a specific command",
            name: "commandHelp",
        },
        "Help for {command}\n{usage}",
        {
            fields: [{
                inline: false,
                name: "Usage",
                value: "{usage}",
            }],
            timestamp: false,
            title: "Help for {command}",
        },
        {
            command: "The command the help was requested for",
            usage: "Usage of the requested command",
        },
    ),
    commandUsage: new TemplatePhrase(
        {
            description: "The template for command usage instructions",
            name: "commandUsage",
        },
        "{description}\n{shortUsage}\n{argumentsUsage}",
        {
            argumentsUsage: "The usage instructions of each argument",
            description: "The description of the command",
            shortUsage: "The short usage of the command",
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
    invalidChannelArgument: new SimplePhrase(
        {
            description: "This is shown when a supplied argument is not a valid channel",
            name: "invalidChannelArgument",
        },
        "The argument does not mention a channel.",
    ),
    invalidChannelMentionArgument: new SimplePhrase(
        {
            description: "This is shown when a supplied argument mentions an invalid channel",
            name: "invalidChannelMentionArgument",
        },
        "The channel mentioned doesn't exist.",
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
    invalidCommandArgument: new SimplePhrase(
        {
            description: "This is shown when a supplied argument is not a valid command",
            name: "invalidCommandArgument",
        },
        "The argument is not a valid command.",
    ),
    invalidIntegerArgument: new SimplePhrase(
        {
            description: "This is shown when a supplied integer argument is not an integer",
            name: "invalidIntegerArgument",
        },
        "The argument is not a valid integer.",
    ),
    invalidMemberArgument: new SimplePhrase(
        {
            description: "This is shown when a supplied argument is not a valid member",
            name: "invalidMemberArgument",
        },
        "The argument does not mention a member.",
    ),
    invalidMemberMentionArgument: new SimplePhrase(
        {
            description: "This is shown when a supplied argument mentions an invalid member",
            name: "invalidMemberMentionArgument",
        },
        "The member mentioned doesn't exist.",
    ),
    invalidMemberOrRoleArgument: new SimplePhrase(
        {
            description: "This is shown when a supplied argument is not a valid member or role",
            name: "invalidMemberOrRoleArgument",
        },
        "The argument does not mention a member or a role.",
    ),
    invalidNumberArgument: new SimplePhrase(
        {
            description: "This is shown when a supplied float argument is not a valid float",
            name: "invalidNumberArgument",
        },
        "The argument is not a valid number.",
    ),
    invalidPermissionArgument: new SimplePhrase(
        {
            description: "This is shown when a supplied argument is not a valid permission",
            name: "invalidPermissionArgument",
        },
        "The argument is not a valid permission.",
    ),
    invalidPrivilegeArgument: new SimplePhrase(
        {
            description: "This is shown when a supplied argument is not a valid privilege",
            name: "invalidPrivilegeArgument",
        },
        "The argument is not a valid privilege.",
    ),
    invalidRoleArgument: new SimplePhrase(
        {
            description: "This is shown when a supplied argument is not a valid role",
            name: "invalidRoleArgument",
        },
        "The argument does not mention a role.",
    ),
    invalidRoleMentionArgument: new SimplePhrase(
        {
            description: "This is shown when a supplied argument mentions an invalid role",
            name: "invalidRoleMentionArgument",
        },
        "The role mentioned doesn't exist.",
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
    invalidTextChannelArgument: new SimplePhrase(
        {
            description: "This is shown when a supplied argument is not a text channel",
            name: "invalidTextChannelArgument",
        },
        "The channel supplied is not a text channel.",
    ),
    invalidUserArgument: new SimplePhrase(
        {
            description: "This is shown when a supplied argument is not a valid user",
            name: "invalidUserArgument",
        },
        "The argument does not mention an user.",
    ),
    invalidUserMentionArgument: new SimplePhrase(
        {
            description: "This is shown when a supplied argument mentions an invalid user",
            name: "invalidUserMentionArgument",
        },
        "The user mentioned doesn't exist.",
    ),
    noPermission: new MessagePhrase(
        {
            description: "This is shown when an user is trying to do something they're not allowed to",
            name: "noPermission",
        },
        "You are not allowed to do that.\nYou don't have the required permission `{permission}`.",
        {
            description: "You are not allowed to do that.\nYou don't have the required permission `{permission}`.",
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
