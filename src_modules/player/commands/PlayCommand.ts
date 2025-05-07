import { Bot, Command, ICommandContext, IExecutionContext, StringArgument, Util, Logger } from "../../..";

import PlayerModule from "..";
import { musicNotFoundPhrase, musicNoVoicePhrase, musicSearchingPhrase, musicYoutubeErrorPhrase, musicUnsupportedUrlPhrase, musicPlaylistErrorPhrase, musicNoInputPhrase, musicNoValidInputPhrase } from "../phrases";
import { IQueueItemDetails, PlayerQueueItem } from "../queue/PlayerQueueItem";

import { VoiceConnection } from "@discordjs/voice";
import { VoiceChannel } from "discord.js";
import ytdl = require("@nuclearplayer/ytdl-core");
import ytpl = require("@distube/ytpl");
import ytsr = require("@distube/ytsr");
import fetch from "node-fetch";
import { Readable } from "stream";
import * as spotifyUri from 'spotify-uri';
const { getPreview } = require('spotify-url-info')(fetch);

export class PlayCommand extends Command<[StringArgument<true>]> {
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
                voiceCommand: true,
            },
            [
                new StringArgument(
                    {
                        description: "The url/search query",
                        name: "music",
                    },
                    true,
                    true,
                ),
            ],
        );
        this.player = player;
    }

    public async execute(context: IExecutionContext<[StringArgument<true>]>) {
        const voiceChannel = context.member.member.voice.channel;
        if (!(voiceChannel instanceof VoiceChannel)) {
            return context.respond(musicNoVoicePhrase, {});
        }
        const url = context.arguments[0];

        // Check if we have either a query or attachments
        if (!url && (!context.message?.message.attachments.size)) {
            return context.respond(musicNoInputPhrase, {});
        }

        const [connection, queueItems] = await Promise.all([
            this.getConnection(context.bot, voiceChannel),
            this.getQueueItem(url, context),
        ]);

        if (!queueItems || queueItems.length === 0) {
            return;
        }

        return this.player.playOrEnqueue(context, connection, queueItems, voiceChannel.bitrate);
    }

    private async getConnection(bot: Bot, voiceChannel: VoiceChannel): Promise<VoiceConnection> {
        return bot.voice.getOrCreateConnection(voiceChannel);
    }

    private async getQueueItem(query: string | undefined, context: ICommandContext): Promise<PlayerQueueItem[] | void> {
        // Check for message attachments first
        if (context.message?.message.attachments.size) {
            const items: PlayerQueueItem[] = [];
            for (const attachment of context.message.message.attachments.values()) {
                const item = await this.getQueueItemFromDirectUrl(attachment.url);
                if (item) {
                    // Update the title to use the attachment filename
                    item.details.title = attachment.name;
                    items.push(item);
                }
            }
            if (items.length > 0) {
                return items;
            }
        }

        // If no attachments or no valid attachments, and no query, return
        if (!query) {
            return context.respond(musicNoValidInputPhrase, {});
        }

        if (!Util.isValidUrl(query)) {
            const searchResult = await this.searchYoutube(query, context);
            if (!searchResult) {
                return context.respond(musicNotFoundPhrase, { search: query });
            }
            return [searchResult];
        } else if (ytpl.validateID(query)) {
            const playlistItems = await this.processPlaylist(query);
            if (!playlistItems) {
                context.respond(musicPlaylistErrorPhrase, { url: query });
                return;
            }
            return playlistItems;
        } else if (ytdl.validateURL(query)) {
            const item = await this.getQueueItemFromYoutubeUrl(query);
            if (!item) {
                context.respond(musicYoutubeErrorPhrase, { url: query });
                return;
            }
            return [item];
        } else if (this.isSpotifyUrl(query)) {
            const item = await this.getQueueItemFromSpotifyUrl(query, context);
            if (!item) {
                return context.respond(musicNotFoundPhrase, { search: query });
            }
            return [item];
        } else {
            const item = await this.getQueueItemFromDirectUrl(query);
            if (!item) {
                return context.respond(musicUnsupportedUrlPhrase, { url: query });
            }
            return [item];
        }
    }

    private isSpotifyUrl(url: string): boolean {
        try {
            const urlObj = new URL(url);

            return urlObj.protocol === "spotify:" || urlObj.hostname.includes("spotify.com");
        } catch {
            return false;
        }
    }

    private async searchYoutube(query: string, context: ICommandContext): Promise<PlayerQueueItem | undefined> {
        const respondPromise = context.respond(musicSearchingPhrase, { search: query });
        let searchResult: ytsr.VideoResult;

        try {
            searchResult = await ytsr(query, {
                limit: 1,
            });
        } catch (error) {
            let errorObj = error as Error;
            Logger.debug(`Failed to search from YouTube: ${query}. Error: ${errorObj.message}`);
            await respondPromise;
            return undefined;
        }

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
            return undefined;
        }
        const itemDetails = {
            author: resultItem.author?.name ?? "",
            authorIconUrl: resultItem.author?.bestAvatar?.url ?? "",
            authorUrl: resultItem.author?.url ?? "",
            duration: resultItem.duration ?? "?",
            thumbnailUrl: resultItem.thumbnails[0]?.url ?? "",
            title: resultItem.name,
            url: resultItem.url,
            urlIsYoutube: true,
        };

        await respondPromise;
        return new PlayerQueueItem(itemDetails);
    }

    private async processPlaylist(url: string): Promise<PlayerQueueItem[] | undefined> {
        let playlist: ytpl.result;

        try {
            playlist = await ytpl(url);
        } catch (error) {
            let errorObj = error as Error;
            Logger.debug(`Failed to get playlist from YouTube URL: ${url}. Error: ${errorObj.message}`);
            return undefined;
        }

        let items = await Promise.all(playlist.items.map(async (item) => await this.getQueueItemFromYoutubeUrl(item.url)));
        return items.filter((item): item is PlayerQueueItem => item !== undefined);
    }

    private async getQueueItemFromYoutubeUrl(url: string): Promise<PlayerQueueItem | undefined> {
        let itemDetails: IQueueItemDetails;
        let ytdlResult: Readable | undefined;

        try {
            ytdlResult = ytdl(url, {
                filter: "audioonly",
                highWaterMark: 1 << 62,
                liveBuffer: 1 << 62,
                dlChunkSize: 0,
            });

            itemDetails = await new Promise((resolve, reject) => {
                ytdlResult!.once("info", (video: ytdl.videoInfo, format: ytdl.videoFormat) => {
                    resolve({
                        author: video.videoDetails.author.name,
                        authorIconUrl: video.videoDetails.author.thumbnails?.[0]?.url ?? "",
                        authorUrl: video.videoDetails.author.channel_url,
                        duration: video.videoDetails.lengthSeconds,
                        thumbnailUrl: video.videoDetails.thumbnails[0]?.url ?? "",
                        title: video.videoDetails.title,
                        url: video.videoDetails.video_url,
                        urlIsYoutube: true,
                    });
                });
            });
        } catch (error) {
            let errorObj = error as Error;
            Logger.debug(`Failed to get queue item from YouTube URL: ${url}. Error: ${errorObj.message}`);
            return undefined;
        }

        return new PlayerQueueItem(itemDetails, ytdlResult);
    }

    private async getQueueItemFromSpotifyUrl(url: string, context: ICommandContext): Promise<PlayerQueueItem | undefined> {
        try {
            const parsed = spotifyUri.parse(url);
            const openUrl = spotifyUri.formatOpenURL(parsed);

            const data = await getPreview(openUrl);

            return this.searchYoutube(`${data.artist} - ${data.title}`, context);
        } catch {
            return undefined;
        }
    }

    private async getQueueItemFromDirectUrl(url: string): Promise<PlayerQueueItem | undefined> {
        let itemDetails: IQueueItemDetails;
        const urlObj = new URL(url);

        // check if the url can be played directly
        const response = await fetch(url);

        if (!response.ok) {
            Logger.debug(`Request to '${url}' failed: ${response.status} ${response.statusText}`);
            return undefined;
        }

        const contentType = response.headers.get("content-type");

        if (!contentType) {
            Logger.debug(`Request to '${url}': content-type was not provided`);
            return undefined;
        }
        if (!contentType.includes("audio") && !contentType.includes("video") && !contentType.includes("ogg")) {
            Logger.debug(`Request to '${url}': unsupported content-type ${contentType}`);
            return undefined;
        }
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
        return new PlayerQueueItem(itemDetails);
    }
}