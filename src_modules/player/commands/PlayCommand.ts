import { Bot, Command, ICommandContext, IExecutionContext, StringArgument, Util } from "../../..";

import PlayerModule from "..";
import { musicNotFoundPhrase, musicNoVoicePhrase, musicSearchingPhrase } from "../phrases";
import { IQueueItemDetails, PlayerQueueItem } from "../queue/PlayerQueueItem";

import { getVoiceConnection, VoiceConnection } from "@discordjs/voice";
import { Guild, VoiceChannel } from "discord.js";
import ytdl = require("@distube/ytdl-core");
import ytpl = require("ytpl");
import ytsr = require("ytsr");
import fetch from "node-fetch";
import { Readable } from "stream";

export class PlayCommand extends Command<[StringArgument<false>]> {
    private player: PlayerModule;

    public constructor(player: PlayerModule) {
        super(
            {
                aliases: ["p"],
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Play some music",
                globalAliases: ["play", "p"],
                name: "play",
            },
            [
                new StringArgument(
                    {
                        description: "The url/search query",
                        name: "music",
                    },
                    false,
                    true,
                ),
            ],
        );
        this.player = player;
    }

    public async execute(context: IExecutionContext<[StringArgument<false>]>) {
        const voiceChannel = context.member.member.voice.channel;
        if (!(voiceChannel instanceof VoiceChannel)) {
            return context.respond(musicNoVoicePhrase, {});
        }
        const url = context.arguments[0];
        const guild = context.guild.guild;

        const [connection, queueItems] = await Promise.all([
            this.getConnection(context.bot, guild, voiceChannel),
            this.getQueueItem(url, context),
        ]);

        if (!queueItems) {
            return;
        }

        return this.player.playOrEnqueue(context, connection, queueItems, voiceChannel.bitrate);
    }

    private async getConnection(bot: Bot, guild: Guild, voiceChannel: VoiceChannel): Promise<VoiceConnection> {
        const connection = getVoiceConnection(guild.id);

        if (connection && voiceChannel.members.get(bot.client!.user!.id)) {
            return connection;
        } else {
            return bot.joinVoice(voiceChannel);
        }
    }

    private async getQueueItem(query: string, context: ICommandContext): Promise<PlayerQueueItem[] | void> {
        let url: string;
        let respondPromise: Promise<void> | undefined;

        if (!Util.isValidUrl(query)) {
            respondPromise = context.respond(musicSearchingPhrase, { search: query });
            const searchResult = await ytsr(query, {
                pages: 1,
            });
            let resultUrl: string | undefined;
            let resultItem: ytsr.Video | undefined;
            for (const item of searchResult.items) {
                if (item.type === "video") {
                    resultUrl = item.url;
                    resultItem = item;
                    break;
                }
            }
            if (resultUrl === undefined || resultItem === undefined) {
                await respondPromise;
                return context.respond(musicNotFoundPhrase, { search: query });
            }
            url = resultUrl;
            const itemDetails = {
                author: resultItem.author?.name ?? "",
                authorIconUrl: resultItem.author?.avatars[0].url ?? "",
                authorUrl: resultItem.author?.url ?? "",
                duration: resultItem.duration ?? "?",
                thumbnailUrl: resultItem.thumbnails[0].url ?? "",
                title: resultItem.title,
                url: resultItem.url,
                urlIsYoutube: true,
            };
            return [new PlayerQueueItem(itemDetails)];
        } else {
            url = query;
            try {
                const playlist = await ytpl(url);
                return Promise.all(playlist.items.map(async (item) => await this.getQueueItemFromUrl(item.url)));
            } catch {
                return [await this.getQueueItemFromUrl(url)];
            }
        }
    }

    private async getQueueItemFromUrl(url: string): Promise<PlayerQueueItem> {
        let ytdlResult: Readable | undefined = ytdl(url, { filter: "audioonly", highWaterMark: 32 * 1024 * 1024 });
        let itemDetails: IQueueItemDetails;

        try {
            itemDetails = await new Promise((resolve, reject) => {
                ytdlResult!.once("info", (video: ytdl.videoInfo, format: ytdl.videoFormat) => {
                    resolve({
                        author: video.videoDetails.author.name,
                        authorIconUrl: video.videoDetails.author.avatar,
                        authorUrl: video.videoDetails.author.channel_url,
                        duration: video.videoDetails.lengthSeconds,
                        thumbnailUrl: video.videoDetails.thumbnail.thumbnails[0]?.url ?? "",
                        title: video.videoDetails.title,
                        url: video.videoDetails.video_url,
                        urlIsYoutube: true,
                    });
                });
                ytdlResult!.once("error", (err) => reject(err));
            });
        } catch {
            ytdlResult = undefined;

            // check if the url can be played directly
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Request to '${url}' failed: ${response.status} ${response.statusText}`);
            }

            const contentType = response.headers.get("content-type");

            if (!contentType) {
                throw new Error(`Request to '${url}': content-type was not provided`);
            }

            if (!contentType.includes("audio") && !contentType.includes("video") && !contentType.includes("ogg")) {
                throw new Error(`Request to '${url}': unsupported content-type ${contentType}`);
            }

            const urlObj = new URL(url);

            itemDetails = {
                author: urlObj.hostname,
                authorIconUrl: "",
                authorUrl: "",
                duration: "?",
                thumbnailUrl: "",
                title: urlObj.pathname,
                url,
                urlIsYoutube: false,
            };
        }

        return new PlayerQueueItem(itemDetails, ytdlResult);
    }
}
