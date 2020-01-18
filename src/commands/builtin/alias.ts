import { MessagePhrase } from "../../language/phrase/MessagePhrase";
import { CommandArgument } from "../arguments/CommandArgument";
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

const aliasListPhrase = new MessagePhrase(
    {
        description: "Shown when command aliases are listed",
        name: "aliasList",
    },
    "Aliases for {guild}:\n{aliases}",
    {
        description: "{aliases}",
        timestamp: false,
        title: "Aliases for {guild}",
    },
    {
        aliases: "List of the aliases",
        guild: "Name of the guild",
    },
);

const aliasSetCommand = new SimpleCommand(
    {
        allowedPrivileges: ["admin"],
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
        new CommandArgument(
            {
                description: "the command the alias refers to",
                name: "command",
            },
            false, true,
        ),
    ] as const,
    async (context) => {
        const guild = context.message.guild;
        const language = context.language;
        await context.bot.commands.setAlias(
            guild,
            language,
            context.arguments[0],
            context.arguments[1],
        );
        await context.respond(aliasSetPhrase, {
            alias: context.arguments[0],
            command: context.arguments[1].getUsageName(language),
        });
    },
);

const aliasRemoveCommand = new SimpleCommand(
    {
        allowedPrivileges: ["admin"],
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
);

const aliasListCommand = new SimpleCommand(
    {
        allowedPrivileges: ["everyone"],
        author: "extcord",
        description: "List command aliases",
        name: "list",
    },
    [],
    async (context) => {
        const map = await context.bot.commands.getGuildCommandsMap(context.message.guild, context.language);
        const aliasMap: Record<string, string[]> = {};
        for (const [alias, command] of map) {
            const localizedName = command.localizedName.get(context.language);
            if (alias === localizedName) {
                continue;
            }
            if (aliasMap[localizedName] === undefined) {
                aliasMap[localizedName] = [];
            }
            aliasMap[localizedName].push(alias);
        }
        return context.respond(aliasListPhrase, {
            aliases: Object.entries(aliasMap)
                .map(([command, list]) => `${command}: \`${list.join(", ")}\``)
                .join("\n"),
            guild: context.message.guild.guild.name,
        });
    },
);

export const aliasCommand = new CommandGroup(
    {
        allowedPrivileges: ["everyone"],
        author: "extcord",
        description: "Set, update or remove an alias",
        name: "alias",
    },
    "list",
);

aliasCommand.addSubcommands(aliasSetCommand, aliasRemoveCommand, aliasListCommand);
aliasCommand.addPhrases(aliasSetPhrase, aliasRemovePhrase, aliasListPhrase);
