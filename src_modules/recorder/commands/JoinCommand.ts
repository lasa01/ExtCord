import { Bot, Command, IExecutionContext } from "../../../dist";

import RecorderModule from "..";
import { voiceJoinPhrase, voiceNoVoicePhrase } from "../phrases";
import { Guild, VoiceChannel } from "discord.js";
import { VoiceConnection } from "@discordjs/voice";

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

        await this.getConnection(context.bot, voiceChannel);

        return context.respond(voiceJoinPhrase, {});
    }

    private async getConnection(bot: Bot, voiceChannel: VoiceChannel): Promise<VoiceConnection> {
        return bot.voice.getOrCreateConnection(voiceChannel);
    }
}
