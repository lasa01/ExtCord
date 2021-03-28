import { Command, IExecutionContext, IntArgument } from "../../..";

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
        const voiceChannel = context.message.member.member.voice.channel;
        if (!voiceChannel) {
            return context.respond(musicNoVoicePhrase, {});
        }
        const guild = context.message.guild.guild;
        if (!guild.voice?.connection || !guild.voice.connection.dispatcher) {
            return context.respond(musicNotPlayingPhrase, {});
        }
        if (guild.voice.channel !== voiceChannel) {
            return context.respond(musicWrongVoicePhrase, {});
        }
        this.player.seek(context, guild.voice.connection, context.arguments[0]);
        return context.respond(musicSeekPhrase, {
            seconds: context.arguments[0].toString(),
        });
    }
}
