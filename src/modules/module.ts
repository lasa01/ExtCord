import { Bot } from "../bot";
import { Command } from "../commands/command";

export abstract class Module {
    public author: string;
    public name: string;
    protected bot: Bot;
    protected commands: Command[];

    public constructor(bot: Bot, author: string, name: string) {
        this.author = author;
        this.name = name;
        this.bot = bot;
        this.commands = [];
    }

    public registerCommand(command: Command) {
        this.bot.commands.register(command);
        this.commands.push(command);
    }

    public rename() {
        this.name = this.author + "-" + this.name;
    }

    public async unload() {
        for (const command of this.commands) {
            this.bot.commands.unregister(command);
        }
    }
}
