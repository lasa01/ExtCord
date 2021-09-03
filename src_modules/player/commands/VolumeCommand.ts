import { AudioPlayerStatus, getVoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { Command, IExecutionContext, IntArgument } from "../../..";

import { musicNotPlayingPhrase, musicNoVoicePhrase, musicVolumePhrase, musicWrongVoicePhrase } from "../phrases";

export class VolumeCommand extends Command<[IntArgument<false>]> {
    public constructor() {
        super(
            {
                aliases: ["v"],
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Change the volume",
                globalAliases: ["volume", "v"],
                name: "volume",
            },
            [
                new IntArgument(
                    {
                        description: "The new volume in percents",
                        name: "volume",
                    },
                    false,
                    1,
                    100,
                ),
            ],
        );
    }

    public async execute(context: IExecutionContext<[IntArgument<false>]>) {
        const voiceChannel = context.message.member.member.voice.channel;
        if (!voiceChannel) {
            return context.respond(musicNoVoicePhrase, {});
        }

        const guild = context.message.guild.guild;
        const connection = getVoiceConnection(guild.id);

        if (
            connection?.state.status !== VoiceConnectionStatus.Ready
            || !connection.state.subscription
            || connection.state.subscription.player.state.status !== AudioPlayerStatus.Playing
        ) {
            return context.respond(musicNotPlayingPhrase, {});
        }

        if (!voiceChannel.members.get(context.bot.client!.user!.id)) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        connection.state.subscription.player.state.resource.volume?.setVolume(context.arguments[0] / 100);
        return context.respond(musicVolumePhrase, {
            volume: context.arguments[0].toString(),
        });
    }
}
