import { Command, IExecutionContext } from "../../..";

import PlayerModule from "..";
import { musicNotPlayingPhrase, musicNoVoicePhrase, musicSkipPhrase, musicWrongVoicePhrase } from "../phrases";

export class SkipCommand extends Command<[]> {
    private player: PlayerModule;

    public constructor(player: PlayerModule) {
        super(
            {
                aliases: ["s"],
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Skip the current song",
                globalAliases: ["skip", "s"],
                name: "skip",
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
        const playing = this.player.getQueue(context.message.guild).playing;
        if (!guild.voice?.connection || !guild.voice.connection.dispatcher || !playing) {
            return context.respond(musicNotPlayingPhrase, {});
        }
        if (guild.voice.channel !== voiceChannel) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        const respondPromise = context.respond(musicSkipPhrase, playing.details);
        guild.voice.connection.dispatcher.end();
        await respondPromise;
    }
}
