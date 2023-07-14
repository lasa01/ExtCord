import { Command, IExecutionContext } from "../../..";
import PlayerModule from "..";
import { getVoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
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
        const connection = getVoiceConnection(guild.id);

        if (connection?.state.status !== VoiceConnectionStatus.Ready || !connection.state.subscription) {
            return context.respond(musicNotPlayingPhrase, {});
        }

        if (!voiceChannel.members.get(context.bot.client!.user!.id)) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        this.player.shuffleQueue(guild);

        return context.respond(musicShufflePhrase, {});
    }
}