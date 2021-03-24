import PlayerModule from "..";
import { Command, IExecutionContext } from "../../..";

import { musicClearPhrase, musicNotPlayingPhrase, musicNoVoicePhrase, musicWrongVoicePhrase } from "../phrases";

export class ClearCommand extends Command<[]> {
    private player: PlayerModule;

    public constructor(player: PlayerModule) {
        super(
            {
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Clear the player queue",
                globalAliases: ["clear"],
                name: "clear",
            },
            [],
        );
        this.player = player;
    }

    public async execute(context: IExecutionContext<[]>) {
        const voiceChannel = context.message.member.member.voice.channel;
        if (!voiceChannel) {
            return context.respond(musicNoVoicePhrase, {});
        }
        const guild = context.message.guild.guild;
        if (!guild.voice?.connection) {
            return context.respond(musicNotPlayingPhrase, {});
        }
        if (guild.voice.channel !== voiceChannel) {
            return context.respond(musicWrongVoicePhrase, {});
        }
        this.player.clearQueue(context.message.guild.guild);
        return context.respond(musicClearPhrase, {});
    }
}
