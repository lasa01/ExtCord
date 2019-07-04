import { MessagePhrase } from "../language/phrase/messagephrase";
import { SimplePhrase } from "../language/phrase/simplephrase";
import { TemplatePhrase } from "../language/phrase/templatephrase";

export const CommandPhrases = {
    executionError: new MessagePhrase({
        name: "executionError",
    }, "Execution failed: {error}", {
        description: "Encountered an unknown error.\n`{error}`",
        timestamp: false,
        title: "Command execution failed",
    }, {
        error: "The error that occured",
    }),
    invalidArgument: new MessagePhrase({
        name: "invalidArgument",
    }, "Argument `{argument}` is invalid.\n{reason}", {
        description: "Argument `{argument}` is invalid:\n{reason}",
        timestamp: false,
        title: "Invalid argument",
    }, {
        argument: "The invalid argument",
        reason: "Why the argument is invalid",
    }),
    invalidCommand: new MessagePhrase({
        name: "invalidCommand",
    }, "Command {command} not found", {
        description: "Command `{command}` doesn't exist.",
        timestamp: false,
        title: "Command not found",
    }, {
        command: "The called command",
    }),
    invalidIntegerArgument: new SimplePhrase({
        name: "invalidIntegerArgument",
    }, "The argument is not a valid integer."),
    invalidNumberArgument: new SimplePhrase({
        name: "invalidNumberArgument",
    }, "The argument is not a valid number."),
    noPermission: new MessagePhrase({
        name: "noPermission",
    }, "You lack permissions to execute the command `{command}`", {
        description: "You lack the permissions required for the command `{command}`.",
        timestamp: false,
        title: "Insufficient permissions",
    }, {
        command: "The called command",
    }),
    tooBigArgument: new TemplatePhrase({
        name: "tooSmallArgument",
    }, "The argument is too big: it shouldn't be more than {max}.", {
        max: "The maximum of the argument",
    }),
    tooFewArguments: new MessagePhrase({
        name: "tooFewArguments",
    }, "Too few arguments supplied: {supplied} supplied, {required} required", {
        description: "The command requires {required} arguments, instead of {supplied}.",
        timestamp: false,
        title: "Too few arguments",
    }, {
        required: "The amount of required arguments",
        supplied: "The amount of supplied arguments",
    }),
    tooManyArguments: new MessagePhrase({
        name: "tooManyArguments",
    }, "Too many arguments supplied: {supplied} supplied, {required} required", {
        description: "The command requires {required} arguments, instead of {supplied}.",
        timestamp: false,
        title: "Too many arguments",
    }, {
        required: "The amount of required arguments",
        supplied: "The amount of supplied arguments",
    }),
    tooSmallArgument: new TemplatePhrase({
        name: "tooSmallArgument",
    }, "The argument is too small: it should be at least {min}.", {
        min: "The minimum of the argument",
    }),
};
