import { getVoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { Command, IExecutionContext } from "../../..";

import { musicNotPlayingPhrase, musicNoVoicePhrase, musicResumePhrase, musicWrongVoicePhrase } from "../phrases";

export class ResumeCommand extends Command<[]> {
    public constructor() {
        super(
            {
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Resume the player",
                globalAliases: ["resume"],
                name: "resume",
            },
            [],
        );
    }

    public async execute(context: IExecutionContext<[]>) {
        const voiceChannel = context.message.member.member.voice.channel;
        if (!voiceChannel) {
            return context.respond(musicNoVoicePhrase, {});
        }

        const guild = context.message.guild.guild;
        const connection = getVoiceConnection(guild.id);

        if (connection?.state.status !== VoiceConnectionStatus.Ready || !connection.state.subscription) {
            return context.respond(musicNotPlayingPhrase, {});
        }

        if (!voiceChannel.members.get(context.bot.client!.user!.id)) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        connection.state.subscription.player.unpause();
        return context.respond(musicResumePhrase, {});
    }
}
