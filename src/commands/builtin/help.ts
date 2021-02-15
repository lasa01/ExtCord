import { DynamicFieldMessagePhrase } from "../../language/phrase/DynamicFieldMessagePhrase";
import { CommandArgument } from "../arguments/CommandArgument";
import { Command } from "../Command";
import { CommandGroup } from "../CommandGroup";
import { SimpleCommand } from "../SimpleCommand";

const helpPhrase = new DynamicFieldMessagePhrase(
    {
        description: "The response template for help command",
        name: "helpPhrase",
    },
    "Available commands:",
    {
        description: "Available commands:",
        timestamp: false,
        title: "Help for {guild}",
    },
    "{description}\n{usage}\nAliases: {aliases}",
    {
        inline: true,
        name: "{description}",
        value: "{usage}\nAliases: {aliases}",
    },
    {
        guild: "The name of the guild",
    },
    {
        aliases: "Aliases for the command",
        description: "The description of the command",
        usage: "The usage of the command",
    },
);

export const helpCommand = new SimpleCommand(
    {
        allowedPrivileges: ["everyone"],
        author: "extcord",
        description: "Show available commands",
        name: "help",
    },
    [
        new CommandArgument(
            {
                description: "The command to show help for",
                name: "command",
            },
            true, true,
        ),
    ] as const,
    async (context) => {
        const commandArg = context.arguments[0];
        if (commandArg) {
            return commandArg.respondHelp(context);
        }
        const map = await context.bot.commands.getGuildCommandsMap(context.message.guild, context.language);
        const commands: Map<Command<any>, {
            aliases: string,
            description: string,
            usage: string,
        }> = new Map();
        const processedCommands = new Set();
        for (const [name, command] of map) {
            if (!processedCommands.has(command)) {
                commands.set(command, {
                    aliases: "none",
                    description: command.localizedDescription.get(context.language),
                    usage: command.getShortUsage(context.language, context.prefix),
                });
                processedCommands.add(command);
                if (command instanceof CommandGroup) {
                    for (const subcommand of command.recurseSubcommands()) {
                        processedCommands.add(subcommand);
                    }
                }
            }
            if (commands.has(command) && name !== command.localizedName.get(context.language)) {
                const c = commands.get(command)!;
                c.aliases = (c.aliases === "none" ? `\`${context.prefix}${name}\`` : `${c.aliases}, \`${context.prefix}${name}\``);
            }
        }
        const stuff = { guild: context.message.guild.guild.name };
        const fieldStuff = Array.from(commands.values());
        return context.respond(helpPhrase, stuff, fieldStuff);
    },
);

helpCommand.addPhrases(helpPhrase);
