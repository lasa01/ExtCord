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
        if (!guild.voice?.connection || !guild.voice.connection.dispatcher) {
            return context.respond(musicNotPlayingPhrase, {});
        }
        if (guild.voice.channel !== voiceChannel) {
            return context.respond(musicWrongVoicePhrase, {});
        }
        guild.voice.connection.dispatcher.setVolume(context.arguments[0] / 100);
        return context.respond(musicVolumePhrase, {
            volume: context.arguments[0].toString(),
        });
    }
}
