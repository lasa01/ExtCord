import { AudioPlayerStatus, VoiceConnectionStatus } from "@discordjs/voice";
import PlayerModule from "..";
import { Command, IExecutionContext, IntArgument } from "../../..";

import { musicNotPlayingPhrase, musicNoVoicePhrase, musicVolumePhrase, musicWrongVoicePhrase } from "../phrases";

export class VolumeCommand extends Command<[IntArgument<false>]> {
    private player: PlayerModule;

    public constructor(player: PlayerModule) {
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

        this.player = player;
    }

    public async execute(context: IExecutionContext<[IntArgument<false>]>) {
        const voiceChannel = context.member.member.voice.channel;
        if (!voiceChannel) {
            return context.respond(musicNoVoicePhrase, {});
        }

        const guild = context.guild.guild;
        const player = this.player.getPlayer(guild);

        if (!this.player.isPlaying(guild) || player?.state.status !== AudioPlayerStatus.Playing) {
            return context.respond(musicNotPlayingPhrase, {});
        }

        if (!voiceChannel.members.get(context.bot.client!.user!.id)) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        player.state.resource.volume?.setVolume(context.arguments[0] / 100);
        return context.respond(musicVolumePhrase, {
            volume: context.arguments[0].toString(),
        });
    }
}
