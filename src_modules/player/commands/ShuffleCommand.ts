import { Command, IExecutionContext } from "../../..";
import PlayerModule from "..";
import { VoiceConnectionStatus } from "@discordjs/voice";
import {
    musicNoVoicePhrase,
    musicNotPlayingPhrase,
    musicWrongVoicePhrase,
    musicShufflePhrase
} from "../phrases";

export class ShuffleCommand extends Command<[]> {
    private player: PlayerModule;

    public constructor(player: PlayerModule) {
        super(
            {
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Shuffle the player queue",
                globalAliases: ["shuffle"],
                name: "shuffle",
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

        this.player.shuffleQueue(guild);

        return context.respond(musicShufflePhrase, {});
    }
}