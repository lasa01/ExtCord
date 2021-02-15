import { Command, IExecutionContext } from "../../..";

import PlayerModule from "..";
import { musicLyricsPhrase, musicNotPlayingPhrase, musicNoVoicePhrase, musicWrongVoicePhrase } from "../phrases";

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

        const playingTitle = queue.playing.details.title;
        const response = await fetch(`https://some-random-api.ml/lyrics?title=${encodeURIComponent(playingTitle)}`, {
            timeout: 10000,
        }).then((res) => res.json());

        if (
            typeof response.title !== "string" ||
            typeof response.author !== "string" ||
            typeof response.lyrics !== "string" ||
            typeof response.thumbnail !== "object" ||
            typeof response.thumbnail.genius !== "string" ||
            typeof response.links !== "object" ||
            typeof response.links.genius !== "string"
        ) {
            throw new Error("unexpected lyrics response format");
        }

        let lyrics: string = response.lyrics;
        lyrics = lyrics.replace("\n", "\n\n");

        return context.respond(musicLyricsPhrase, {
            author: response.author,
            lyrics,
            thumbnailUrl: response.thumbnail.genius,
            title: response.title,
            url: response.links.genius,
        });
    }
}
