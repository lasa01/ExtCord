import PlayerModule from "..";
import { Command, IExecutionContext } from "../../..";

import { musicNotPlayingPhrase, musicNoVoicePhrase, musicStopPhrase, musicWrongVoicePhrase } from "../phrases";

export class StopCommand extends Command<[]> {
    private player: PlayerModule;

    public constructor(player: PlayerModule) {
        super(
            {
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Stop the player",
                globalAliases: ["stop"],
                name: "stop",
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
        this.player.disconnect(context.message.guild.guild);
        return context.respond(musicStopPhrase, {});
    }
}
