import { VoiceConnectionStatus } from "@discordjs/voice";
import PlayerModule from "..";
import { Command, IExecutionContext } from "../../..";

import { musicNotPlayingPhrase, musicNoVoicePhrase, musicStopPhrase, musicWrongVoicePhrase } from "../phrases";

export class StopCommand extends Command<[]> {
    private player: PlayerModule;

    public constructor(player: PlayerModule) {
        super(
            {
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Stop the player",
                globalAliases: ["stop"],
                name: "stop",
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
        const connection = context.bot.voice.getConnection(guild);

        if (connection?.state.status !== VoiceConnectionStatus.Ready) {
            return context.respond(musicNotPlayingPhrase, {});
        }

        if (!voiceChannel.members.get(context.bot.client!.user!.id)) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        this.player.disconnect(context.guild.guild);
        return context.respond(musicStopPhrase, {});
    }
}
