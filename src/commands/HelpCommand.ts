import { Command, IExecutionContext } from "./Command";
import { CommandPhrases } from "./CommandPhrases";

export class HelpCommand extends Command<[]> {
    public constructor() {
        super({
            author: "extcord",
            description: "Show available commands",
            name: "help",
        }, [], ["everyone"]);
    }

    public async execute(context: IExecutionContext<[]>) {
        const map = await context.bot.commands.getGuildCommandsMap(context.message.guild, context.language);
        const commands: Map<Command<any>, {
            aliases: string,
            description: string,
            usage: string,
        }> = new Map();
        for (const [name, command] of map) {
            if (!commands.has(command)) {
                commands.set(command, {
                    aliases: "none",
                    description: command.localizedDescription.get(context.language),
                    usage: command.getShortUsage(context.language),
                });
            }
            if (name !== command.localizedName.get(context.language)) {
                const c = commands.get(command)!;
                c.aliases = (c.aliases === "none" ? `\`${name}\`` : `${c.aliases}, \`${name}\``);
            }
        }
        const stuff = { guild: context.message.guild.guild.name };
        const fieldStuff = Array.from(commands.values());
        return context.respond(CommandPhrases.helpCommand, stuff, fieldStuff);
    }
}
