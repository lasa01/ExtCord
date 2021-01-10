import { Command, IExecutionContext } from "../../..";

import { musicNotPlayingPhrase, musicNoVoicePhrase, musicPausePhrase, musicWrongVoicePhrase } from "../phrases";

export class PauseCommand extends Command<[]> {
    public constructor() {
        super(
            {
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Pause the player",
                name: "pause",
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
        if (!guild.voice?.connection || !guild.voice.connection.dispatcher) {
            return context.respond(musicNotPlayingPhrase, {});
        }
        if (guild.voice.channel !== voiceChannel) {
            return context.respond(musicWrongVoicePhrase, {});
        }
        guild.voice.connection.dispatcher.pause();
        return context.respond(musicPausePhrase, {});
    }
}
