import { Command, IExecutionContext, IntArgument } from "../../..";

import { getVoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import PlayerModule from "..";
import { musicNotPlayingPhrase, musicNoVoicePhrase, musicSeekPhrase, musicWrongVoicePhrase } from "../phrases";

export class SeekCommand extends Command<[IntArgument<false>]> {
    private player: PlayerModule;

    public constructor(player: PlayerModule) {
        super(
            {
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Seek the player",
                globalAliases: ["seek"],
                name: "seek",
            },
            [
                new IntArgument(
                    {
                        description: "The time to seek to in seconds",
                        name: "seconds",
                    },
                    false,
                    0,
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
        const connection = getVoiceConnection(guild.id);

        if (connection?.state.status !== VoiceConnectionStatus.Ready || !connection.state.subscription) {
            return context.respond(musicNotPlayingPhrase, {});
        }

        if (!voiceChannel.members.get(context.bot.client!.user!.id)) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        this.player.seek(context, connection, context.arguments[0], voiceChannel.bitrate);
        return context.respond(musicSeekPhrase, {
            seconds: context.arguments[0].toString(),
        });
    }
}
