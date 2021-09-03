import { Command, IExecutionContext } from "../../..";

import { getVoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
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
        const voiceChannel = context.message.member.member.voice.channel;
        if (!voiceChannel) {
            return context.respond(musicNoVoicePhrase, {});
        }

        const guild = context.message.guild.guild;
        const connection = getVoiceConnection(guild.id);
        const queue = this.player.getQueue(context.message.guild);

        if (
            connection?.state.status !== VoiceConnectionStatus.Ready
            || !connection.state.subscription
            || !queue.playing
        ) {
            return context.respond(musicNotPlayingPhrase, {});
        }

        if (!voiceChannel.members.get(context.bot.client!.user!.id)) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        return context.respond(musicQueuePhrase, queue.playing.details, queue.queue.map((item) => item.details));
    }
}
