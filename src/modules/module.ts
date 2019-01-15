import Bot from "../bot";

export default abstract class Module {
    public author: string;
    public name: string;
    protected bot: Bot;

    public constructor(bot: Bot) {
        this.author = "";
        this.name = "";
        this.bot = bot;
    }
}
