import { Bot, Command, IExecutionContext } from "../../../dist";

import RecorderModule from "..";
import { voiceJoinPhrase, voiceNoVoicePhrase } from "../phrases";
import { Guild, VoiceChannel } from "discord.js";
import { getVoiceConnection, VoiceConnection } from "@discordjs/voice";

export class JoinCommand extends Command<[]> {

    public constructor() {
        super(
            {
                aliases: ["j"],
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Join a voice channel",
                globalAliases: ["join", "j"],
                name: "join",
            },
            [],
        );
    }

    public async execute(context: IExecutionContext<[]>) {
        const voiceChannel = context.member.member.voice.channel;

        if (!(voiceChannel instanceof VoiceChannel)) {
            return context.respond(voiceNoVoicePhrase, {});
        }

        await this.getConnection(context.bot, context.guild.guild, voiceChannel);

        return context.respond(voiceJoinPhrase, {});
    }

    private async getConnection(bot: Bot, guild: Guild, voiceChannel: VoiceChannel): Promise<VoiceConnection> {
        const connection = getVoiceConnection(guild.id);

        if (connection && voiceChannel.members.get(bot.client!.user!.id)) {
            return connection;
        } else {
            return bot.joinVoice(voiceChannel);
        }
    }
}
