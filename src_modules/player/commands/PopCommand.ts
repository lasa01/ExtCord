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
        const voiceChannel = context.member.voice.channel;
        const botVoiceChannel = guild.me.voice.channel;

        if (!voiceChannel) {
            return context.respond(musicNoVoicePhrase, {});
        }

        if (voiceChannel !== botVoiceChannel) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        if (!this.player.getQueue(context.guild).playing) {
            return context.respond(musicNotPlayingPhrase, {});
        }

        const result = this.player.popQueue(guild);

        if (result) {
            return context.respond(musicPopPhrase, {});
        } else {
            return context.respond(musicEmptyQueuePhrase, {});
        }
    }

    // Add the missing methods
    public getVoiceState() {
        // Define the getVoiceState method in the IExtendedMember class
    }

    public getBotVoiceChannel() {
        // Define the getBotVoiceChannel method in the Guild class
    }

    public isPlaying() {
        // Define the isPlaying method in the PlayerModule class
    }
}