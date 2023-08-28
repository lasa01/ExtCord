import { Command, IExecutionContext } from "../../..";

import PlayerModule from "..";
import { musicNotPlayingPhrase, musicNoVoicePhrase, musicPausePhrase, musicWrongVoicePhrase } from "../phrases";

export class PauseCommand extends Command<[]> {
    private player: PlayerModule;

    public constructor(player: PlayerModule) {
        super(
            {
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Pause the player",
                globalAliases: ["pause"],
                name: "pause",
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

        this.player.getPlayer(guild)?.pause();
        return context.respond(musicPausePhrase, {});
    }
}
