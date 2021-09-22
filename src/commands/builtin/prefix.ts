import { MessagePhrase } from "../../language/phrase/MessagePhrase";
import { StringArgument } from "../arguments/StringArgument";
import { CommandGroup } from "../CommandGroup";
import { SimpleCommand } from "../SimpleCommand";

const prefixSetPhrase = new MessagePhrase(
    {
        description: "Shown when the prefix is updated",
        name: "prefixSet",
    },
    "The prefix has been successfully set to `{prefix}`.",
    {
        description: "The prefix has been successfully set to `{prefix}`.",
        timestamp: false,
        title: "Prefix updated",
    },
    {
        prefix: "the new prefix",
    });

const prefixShowPhrase = new MessagePhrase(
    {
        description: "Shown when the prefix is shown",
        name: "prefixShow",
    },
    "The current prefix is `{prefix}`.",
    {
        timestamp: false,
        title: "The current prefix is `{prefix}`",
    },
    {
        prefix: "the current prefix",
    },
);

const prefixShowCommand = new SimpleCommand(
    {
        allowedPrivileges: ["everyone"],
        author: "extcord",
        description: "Show the command prefix",
        name: "show",
    },
    [],
    (context) => context.respond(prefixShowPhrase, { prefix: context.prefix }),
);

const prefixSetCommand = new SimpleCommand(
    {
        allowedPrivileges: ["admin"],
        author: "extcord",
        description: "Set the command prefix",
        name: "set",
    },
    [
        new StringArgument(
            {
                description: "the new prefix",
                name: "prefix",
            },
            false,
        ),
    ] as const,
    async (context) => {
        const prefix = context.arguments[0];
        if (context.prefix !== prefix) {
            await context.bot.commands.prefixConfigEntry.guildSet(context.guild, prefix);
        }
        await context.respond(prefixSetPhrase, { prefix });
    },
);

export const prefixCommand = new CommandGroup(
    {
        allowedPrivileges: ["everyone"],
        author: "extcord",
        description: "Show or update the command prefix",
        name: "prefix",
    },
    "show",
);

prefixCommand.addSubcommands(prefixSetCommand, prefixShowCommand);
prefixCommand.addPhrases(prefixSetPhrase, prefixShowPhrase);
