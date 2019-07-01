import { MessagePhrase } from "../language/phrase/messagephrase";

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
    }, "Argument `{argument}` is invalid", {
        description: "Argument `{argument}` is invalid.",
        timestamp: false,
        title: "Invalid argument",
    }, {
        argument: "The invalid argument",
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
    invalidIntegerArgument: new MessagePhrase({
        name: "invalidIntegerArgument",
    }, "Argument `{argument}` is not a valid integer", {
        description: "Argument `{argument}` is not a valid integer.",
        timestamp: false,
        title: "Invalid argument",
    }, {
        argument: "The invalid argument",
    }),
    invalidNumberArgument: new MessagePhrase({
        name: "invalidNumberArgument",
    }, "Argument `{argument}` is not a valid number", {
        description: "Argument `{argument}` is not a valid number.",
        timestamp: false,
        title: "Invalid argument",
    }, {
        argument: "The invalid argument",
    }),
    noPermission: new MessagePhrase({
        name: "noPermission",
    }, "You lack permissions to execute the command `{command}`", {
        description: "You lack the permissions required for the command `{command}`.",
        timestamp: false,
        title: "Insufficient permissions",
    }, {
        command: "The called command",
    }),
    tooBigArgument: new MessagePhrase({
        name: "tooSmallArgument",
    }, "Argument `{argument}` is too big: it shouldn't be more than {max}", {
        description: "Argument `{argument}` is too big.\nit shouldn't be more than {max}.",
        timestamp: false,
        title: "Invalid argument",
    }, {
        argument: "The invalid argument",
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
    tooSmallArgument: new MessagePhrase({
        name: "tooSmallArgument",
    }, "Argument `{argument}` is too small: it should be at least {min}", {
        description: "Argument `{argument}` is too small.\nIt should be at least {min}.",
        timestamp: false,
        title: "Invalid argument",
    }, {
        argument: "The invalid argument",
        min: "The minimum of the argument",
    }),
};
