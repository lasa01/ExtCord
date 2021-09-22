import { getVoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { Command, IExecutionContext } from "../../..";

import { musicNotPlayingPhrase, musicNoVoicePhrase, musicPausePhrase, musicWrongVoicePhrase } from "../phrases";

export class PauseCommand extends Command<[]> {
    public constructor() {
        super(
            {
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Pause the player",
                globalAliases: ["pause"],
                name: "pause",
            },
            [],
        );
    }

    public async execute(context: IExecutionContext<[]>) {
        const voiceChannel = context.member.member.voice.channel;
        if (!voiceChannel) {
            return context.respond(musicNoVoicePhrase, {});
        }

        const guild = context.guild.guild;
        const connection = getVoiceConnection(guild.id);

        if (connection?.state.status !== VoiceConnectionStatus.Ready || !connection.state.subscription) {
            return context.respond(musicNotPlayingPhrase, {});
        }

        if (!voiceChannel.members.get(context.bot.client!.user!.id)) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        connection.state.subscription.player.pause();
        return context.respond(musicPausePhrase, {});
    }
}
