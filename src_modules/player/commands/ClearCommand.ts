import PlayerModule from "..";
import { Command, IExecutionContext } from "../../..";

import { musicClearPhrase, musicNotPlayingPhrase, musicNoVoicePhrase, musicWrongVoicePhrase } from "../phrases";

export class ClearCommand extends Command<[]> {
    private player: PlayerModule;

    public constructor(player: PlayerModule) {
        super(
            {
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Clear the player queue",
                globalAliases: ["clear"],
                name: "clear",
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

        this.player.clearQueue(guild);

        return context.respond(musicClearPhrase, {});
    }
}
