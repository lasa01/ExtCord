import { Command, IExecutionContext } from "../../..";

import { VoiceConnectionStatus } from "@discordjs/voice";
import PlayerModule from "..";
import { musicNotPlayingPhrase, musicNoVoicePhrase, musicQueuePhrase, musicWrongVoicePhrase } from "../phrases";

export class QueueCommand extends Command<[]> {
    private player: PlayerModule;

    public constructor(player: PlayerModule) {
        super(
            {
                aliases: ["q"],
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Show the player queue",
                globalAliases: ["queue", "q"],
                name: "queue",
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
        const queue = this.player.getQueue(context.guild);

        if (!this.player.isPlaying(guild) || queue.playing === undefined) {
            return context.respond(musicNotPlayingPhrase, {});
        }

        if (!voiceChannel.members.get(context.bot.client!.user!.id)) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        return context.respond(musicQueuePhrase, queue.playing.details, queue.queue.map((item) => item.details));
    }
}
