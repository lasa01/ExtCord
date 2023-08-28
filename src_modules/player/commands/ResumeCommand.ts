import { VoiceConnectionStatus } from "@discordjs/voice";
import PlayerModule from "..";
import { Command, IExecutionContext } from "../../..";

import { musicNotPlayingPhrase, musicNoVoicePhrase, musicResumePhrase, musicWrongVoicePhrase } from "../phrases";

export class ResumeCommand extends Command<[]> {
    private player: PlayerModule;

    public constructor(player: PlayerModule) {
        super(
            {
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Resume the player",
                globalAliases: ["resume"],
                name: "resume",
                voiceCommand: true,
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

        if (!this.player.isPlaying(guild)) {
            return context.respond(musicNotPlayingPhrase, {});
        }

        if (!voiceChannel.members.get(context.bot.client!.user!.id)) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        this.player.getPlayer(guild)?.unpause();
        return context.respond(musicResumePhrase, {});
    }
}
