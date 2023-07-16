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
        const guild = context.guild.guild;
        const voiceChannel = context.member.getVoiceState().channel;
        const botVoiceChannel = guild.getBotVoiceChannel();

        if (!voiceChannel) {
            return context.respond(musicNoVoicePhrase, {});
        }

        if (voiceChannel !== botVoiceChannel) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        if (!this.player.isPlaying()) {
            return context.respond(musicNotPlayingPhrase, {});
        }


        const result = this.player.popQueue(guild);

        if (result) {
            return context.respond(musicPopPhrase, {});
        } else {
            return context.respond(musicEmptyQueuePhrase, {});
        }
    }
}