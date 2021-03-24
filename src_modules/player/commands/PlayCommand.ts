import { Command, ICommandContext, IExecutionContext, StringArgument, Util } from "../../..";

import PlayerModule from "..";
import { musicNotFoundPhrase, musicNoVoicePhrase, musicSearchingPhrase } from "../phrases";
import { IQueueItemDetails, PlayerQueueItem } from "../queue/PlayerQueueItem";

import { Guild, VoiceChannel, VoiceConnection } from "discord.js";
import ytdl = require("ytdl-core");
import ytpl = require("ytpl");
import ytsr = require("ytsr");

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
        const voiceChannel = context.message.member.member.voice.channel;
        if (!voiceChannel) {
            return context.respond(musicNoVoicePhrase, {});
        }
        const url = context.arguments[0];
        const guild = context.message.message.guild!;

        const [connection, queueItems] = await Promise.all([
            this.getConnection(guild, voiceChannel),
            this.getQueueItem(url, context),
        ]);

        if (!queueItems) {
            return;
        }

        return this.player.playOrEnqueue(context, connection, queueItems);
    }

    private async getConnection(guild: Guild, voiceChannel: VoiceChannel): Promise<VoiceConnection> {
        if (guild.voice?.channel === voiceChannel && guild.voice.connection) {
            return guild.voice.connection;
        } else {
            return voiceChannel.join();
        }
    }

    private async getQueueItem(query: string, context: ICommandContext): Promise<PlayerQueueItem[]|void> {
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
        const ytdlResult = ytdl(url, { filter: "audioonly" });
        const itemDetails: IQueueItemDetails = await new Promise((resolve, reject) => {
            ytdlResult!.once("info", (video: ytdl.videoInfo, format: ytdl.videoFormat) => {
                resolve({
                    author: video.videoDetails.author.name,
                    authorIconUrl: video.videoDetails.author.avatar,
                    authorUrl: video.videoDetails.author.channel_url,
                    duration: video.videoDetails.lengthSeconds,
                    thumbnailUrl: video.videoDetails.thumbnail.thumbnails[0]?.url ?? "",
                    title: video.videoDetails.title,
                    url: video.videoDetails.video_url,
                });
            });
            ytdlResult!.once("error", (err) => reject(err));
        });
        return new PlayerQueueItem(itemDetails, ytdlResult);
    }
}
