import { Command, IExecutionContext } from "../../..";

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
        const queue = this.player.getQueue(context.message.guild);
        if (!guild.voice?.connection || !guild.voice.connection.dispatcher || !queue.playing) {
            return context.respond(musicNotPlayingPhrase, {});
        }
        if (guild.voice.channel !== voiceChannel) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        return context.respond(musicQueuePhrase, queue.playing.details, queue.queue.map((item) => item.details));
    }
}
