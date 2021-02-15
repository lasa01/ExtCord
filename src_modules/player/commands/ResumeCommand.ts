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
        if (!guild.voice?.connection || !guild.voice.connection.dispatcher) {
            return context.respond(musicNotPlayingPhrase, {});
        }
        if (guild.voice.channel !== voiceChannel) {
            return context.respond(musicWrongVoicePhrase, {});
        }
        guild.voice.connection.dispatcher.resume();
        return context.respond(musicResumePhrase, {});
    }
}
