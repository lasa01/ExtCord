import { MessagePhrase } from "../../language/phrase/MessagePhrase";
import { TemplatePhrase } from "../../language/phrase/TemplatePhrase";
import { StringArgument } from "../arguments/StringArgument";
import { CommandGroup } from "../CommandGroup";
import { SimpleCommand } from "../SimpleCommand";

const aliasSetPhrase = new MessagePhrase(
    {
        description: "Shown when an alias is added or updated",
        name: "aliasSet",
    },
    "The alias `{alias}` has been added to the command `{command}`.",
    {
        description: "The alias `{alias}` has been added to the command `{command}`.",
        timestamp: false,
        title: "Alias added",
    },
    {
        alias: "the alias",
        command: "the command the alias is for",
    });

const aliasRemovePhrase = new MessagePhrase(
    {
        description: "Shown when an alias is removed",
        name: "aliasRemove",
    },
    "The alias `{alias}` has been removed.",
    {
        description: "The alias `{alias}` has been removed.",
        timestamp: false,
        title: "Alias removed",
    },
    {
        alias: "the removed alias",
    },
);
const commandNotFoundPhrase = new TemplatePhrase(
    {
        description: "Shown when a command (argument) is not found",
        name: "commandNotFound",
    },
    "The argument {command} is not a valid command.",
    {
        command: "the supplied command",
    },
);

const aliasSetCommand = new SimpleCommand(
    {
        author: "extcord",
        description: "Add or update an alias",
        name: "set",
    },
    [
        new StringArgument(
            {
                description: "the alias",
                name: "alias",
            },
            false,
        ),
        new StringArgument(
            {
                description: "the command the alias refers to",
                name: "command",
            },
            false, false,
            async (data, context, error) => {
                const c = await context.bot.commands.getCommandInstance(context.message.guild, context.language, data);
                if (!c) {
                    return error(commandNotFoundPhrase, { command: data });
                }
                return true;
            },
        ),
    ] as const,
    async (context) => {
        const guild = context.message.guild;
        const language = context.language;
        const command = await context.bot.commands.getCommandInstance(guild, language, context.arguments[1]);
        await context.bot.commands.setAlias(
            guild,
            language,
            context.arguments[0],
            command!,
        );
        await context.respond(aliasSetPhrase, { alias: context.arguments[0], command: context.arguments[1] });
    },
    ["admin"],
);

const aliasRemoveCommand = new SimpleCommand(
    {
        author: "extcord",
        description: "Remove an alias",
        name: "remove",
    },
    [
        new StringArgument(
            {
                description: "the alias to remove",
                name: "alias",
            },
            false,
        ),
    ] as const,
    async (context) => {
        const alias = context.arguments[0];
        await context.bot.commands.removeAlias(context.message.guild, context.language, alias);
        await context.respond(aliasRemovePhrase, { alias });
    },
    ["admin"],
);

export const aliasCommand = new CommandGroup(
    {
        author: "extcord",
        description: "Set, update or remove an alias",
        name: "alias",
    },
    undefined, undefined,
    ["admin"],
);

aliasCommand.addSubcommands(aliasSetCommand, aliasRemoveCommand);
aliasCommand.addPhrases(aliasSetPhrase, aliasRemovePhrase, commandNotFoundPhrase);
