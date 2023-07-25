import { VoiceConnectionStatus } from "@discordjs/voice";
import { Command, IExecutionContext } from "../../..";
import PlayerModule from "..";
import { musicPopPhrase, musicEmptyQueuePhrase, musicNoVoicePhrase, musicNotPlayingPhrase, musicWrongVoicePhrase } from "../phrases";

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
        const voiceChannel = context.member.voiceState.channel;
        if (!voiceChannel) {
            return context.respond(musicNoVoicePhrase, {});
        }

        const voiceConnection = this.player.getVoiceConnection(guild);
        if (!voiceConnection || voiceConnection.state.status !== VoiceConnectionStatus.Ready || !voiceConnection.state.subscription) {
            return context.respond(musicNotPlayingPhrase, {});
        }

        if (voiceConnection.joinConfig.channelId !== voiceChannel.id) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        const result = this.player.popQueue(guild);

        if (result) {
            return context.respond(musicPopPhrase, {});
        } else {
            return context.respond(musicEmptyQueuePhrase, {});
        }
    }
}