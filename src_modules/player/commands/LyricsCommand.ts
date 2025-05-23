import { Command, IExecutionContext } from "../../..";

import PlayerModule from "..";
import {
    musicLyricsErrorPhrase,
    musicLyricsNotFoundPhrase,
    musicLyricsPhrase,
    musicLyricsRateLimitedPhrase,
    musicNotPlayingPhrase,
    musicNoVoicePhrase,
    musicWrongVoicePhrase,
} from "../phrases";

import fetch from "node-fetch";

export class LyricsCommand extends Command<[]> {
    private player: PlayerModule;

    public constructor(player: PlayerModule) {
        super(
            {
                aliases: ["l"],
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Get lyrics for the currently playing song",
                globalAliases: ["lyrics", "l"],
                name: "lyrics",
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
        const queue = this.player.getQueue(context.guild);

        if (!this.player.isPlaying(guild) || queue.playing === undefined) {
            return context.respond(musicNotPlayingPhrase, {});
        }

        if (!voiceChannel.members.get(context.bot.client!.user!.id)) {
            return context.respond(musicWrongVoicePhrase, {});
        }

        const playingTitle = queue.playing.details.title;
        const response = await fetch(`https://some-random-api.com/lyrics?title=${encodeURIComponent(playingTitle)}`, {
            timeout: 10000,
        });

        if (!response.ok) {
            if (response.status === 404) {
                return context.respond(musicLyricsNotFoundPhrase, { title: playingTitle });
            } else if (response.status === 500) {
                return context.respond(musicLyricsErrorPhrase, { title: playingTitle });
            } else if (response.status === 429) {
                return context.respond(musicLyricsRateLimitedPhrase, {});
            }
        }

        const data: { [key: string]: any } = await response.json() as any;

        const thumbnailUrl = Object.values(data.thumbnail)[0];
        const url = Object.values(data.links)[0];

        if (
            typeof data.title !== "string" ||
            typeof data.author !== "string" ||
            typeof data.lyrics !== "string" ||
            typeof thumbnailUrl !== "string" ||
            typeof url !== "string"
        ) {
            throw new Error("unexpected lyrics response format");
        }

        let lyrics: string = data.lyrics;
        lyrics = lyrics.replace("\n", "\n\n");

        return context.respond(musicLyricsPhrase, {
            author: data.author,
            lyrics,
            thumbnailUrl,
            title: data.title,
            url,
        });
    }
}
