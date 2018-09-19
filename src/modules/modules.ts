import Bot from "../bot";
import Module from "./module";

export default class Modules {
    private bot: Bot;
    private modules: Map<string, Module>;

    constructor(bot: Bot) {
        this.bot = bot;
        this.modules = new Map();
    }
}
