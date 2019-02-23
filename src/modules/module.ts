import { Bot } from "../bot";

export abstract class Module {
    public author: string;
    public name: string;
    protected bot: Bot;

    public constructor(bot: Bot, author: string, name: string) {
        this.author = author;
        this.name = name;
        this.bot = bot;
    }

    public rename() {
        this.name = this.author + "-" + this.name;
    }

    public async unload() { return; }
}
