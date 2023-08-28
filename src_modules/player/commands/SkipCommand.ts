import { Command, IExecutionContext } from "../../..";

import { VoiceConnectionStatus } from "@discordjs/voice";
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
                voiceCommand: true,
            },
            [],
        );
        this.player = player;
    }

    public async execute(context: IExecutionContext<[]>) {
        const voiceChannel = context.member.member.voice.channel;
        if (!voiceChannel) {
            return context.respond(musicNoVoicePhrase, {});
        }

        const guild = context.guild.guild;
        const playing = this.player.getQueue(context.guild).playing;

        if (!this.player.isPlaying(guild) || playing === undefined) {
            return context.respond(musicNotPlayingPhrase, {});
        }

        if (!voiceChannel.members.get(context.bot.client!.user!.id)) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        const respondPromise = context.respond(musicSkipPhrase, playing.details);
        this.player.getPlayer(guild)?.stop();
        await respondPromise;
    }
}
