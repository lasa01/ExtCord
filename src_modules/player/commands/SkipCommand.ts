import { Command, IExecutionContext } from "../../..";

import { getVoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
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
        const voiceChannel = context.member.member.voice.channel;
        if (!voiceChannel) {
            return context.respond(musicNoVoicePhrase, {});
        }

        const guild = context.guild.guild;
        const connection = getVoiceConnection(guild.id);
        const playing = this.player.getQueue(context.guild).playing;

        if (connection?.state.status !== VoiceConnectionStatus.Ready || !connection.state.subscription || !playing) {
            return context.respond(musicNotPlayingPhrase, {});
        }

        if (!voiceChannel.members.get(context.bot.client!.user!.id)) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        const respondPromise = context.respond(musicSkipPhrase, playing.details);
        connection.state.subscription.player.stop();
        await respondPromise;
    }
}
