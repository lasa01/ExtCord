// extcord module
// requires ffmpeg-static ytdl-core ytsr

import { Bot, Module } from "../..";
import { getCommand } from "./commands";

export default class PlayerModule extends Module {
    constructor(bot: Bot) {
        super(bot, "extcord", "player");
        this.registerCommand(getCommand(this));
    }
}
