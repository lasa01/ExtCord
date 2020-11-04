// extcord module
// requires ffmpeg-static ytdl-core

import { Bot, Module } from "../..";
import { musicCommand } from "./commands";

export default class PlayerModule extends Module {
    constructor(bot: Bot) {
        super(bot, "extcord", "player");
        this.registerCommand(musicCommand);
    }
}
