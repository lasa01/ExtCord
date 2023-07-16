import { Command, IExecutionContext } from "../../..";
import PlayerModule from "..";
import { musicNoVoicePhrase, musicNotPlayingPhrase, musicWrongVoicePhrase, musicPopPhrase, musicEmptyQueuePhrase } from "../phrases";

export class PopCommand extends Command<[]> {
    private player: PlayerModule;

    public constructor(player: PlayerModule) {
        super(
            {
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Remove the last item from the player queue",
                globalAliases: ["pop"],
                name: "pop",
            },
            [],
        );
        this.player = player;
    }

    public async execute(context: IExecutionContext<[]>) {
        const guild = context.guild as IExtendedGuild;
        const voiceChannel = (context.member as IExtendedMember).getVoiceChannel();
        const botVoiceChannel = guild.getBotVoiceChannel();

        if (!voiceChannel) {
            return context.respond(musicNoVoicePhrase, {});
        }

        if (voiceChannel !== botVoiceChannel) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        if (!this.player.getQueue(context.guild).playing) {
            return context.respond(musicNotPlayingPhrase, {});
        }

        // Copy the checks from the `ShuffleCommand` class and add them here
        if (this.player.getQueue(context.guild).length < 2) {
            return context.respond(musicEmptyQueuePhrase, {});
        }

        const result = this.player.popQueue(guild.getGuildInstance());

        if (result) {
            return context.respond(musicPopPhrase, {});
        } else {
            return context.respond(musicEmptyQueuePhrase, {});
        }
    }
}