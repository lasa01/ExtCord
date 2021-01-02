import { VoiceConnection } from "discord.js";
import { URL } from "url";
import PlayerModule from ".";
import { CommandGroup, IntArgument, MessagePhrase, SimpleCommand, StringArgument } from "../..";

import ytdl = require("ytdl-core");
import ytsr = require("ytsr");

function isValidUrl(url: string) {
    try {
        // tslint:disable-next-line:no-unused-expression
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

const musicPlayPhrase = new MessagePhrase(
    {
        description: "Shown when something is played",
        name: "musicPlay",
    },
    "Playing `{title}`.",
    {
        author: {
            iconUrl: "{authorIconUrl}",
            name: "{author}",
            url: "{authorUrl}",
        },
        description: "Duration: {duration} s",
        thumbnailUrl: "{thumbnailUrl}",
        timestamp: false,
        title: "Playing {title}",
        url: "{url}",
    },
    {
        author: "The author of what is being played",
        authorIconUrl: "The url of the author's icon",
        authorUrl: "The url of the author",
        duration: "The duration of what is being played.",
        thumbnailUrl: "The url of the thumbnail",
        title: "Title of what is being played",
        url: "The url of what is being played",
    },
);

const musicSearchingPhrase = new MessagePhrase(
    {
        description: "Shown when searching for a song",
        name: "musicSearching",
    },
    "Searching Youtube for `{search}`...",
    {
        description: "Searching for `{search}`.",
        timestamp: false,
        title: "Searching Youtube...",
    },
    {
        search: "The search string",
    },
);

const musicNotFoundPhrase = new MessagePhrase(
    {
        description: "Shown when search returned no results",
        name: "musicNotFound",
    },
    "Couldn't find anything for `{search}`.",
    {
        description: "Couldn't find anything for `{search}`.",
        timestamp: false,
        title: "Not found",
    },
    {
        search: "The search string",
    },
);

const musicNoVoicePhrase = new MessagePhrase(
    {
        description: "Shown when user isn't in a voice channel",
        name: "musicNoVoice",
    },
    "You are not in a voice channel.",
    {
        description: "You are not in a voice channel.",
        timestamp: false,
        title: "No voice channel",
    },
    {},
);

const musicWrongVoicePhrase = new MessagePhrase(
    {
        description: "Shown when user is in wrong voice channel",
        name: "musicWrongVoice",
    },
    "You are in the wrong voice channel.",
    {
        description: "You are in the wrong voice channel.",
        timestamp: false,
        title: "Wrong voice channel",
    },
    {},
);

const musicNotPlayingPhrase = new MessagePhrase(
    {
        description: "Shown when music isn't playing",
        name: "musicNotPlaying",
    },
    "Nothing is playing.",
    {
        description: "Nothing is playing.",
        timestamp: false,
        title: "Nothing is playing",
    },
    {},
);

const musicPausePhrase = new MessagePhrase(
    {
        description: "Shown when music is paused",
        name: "musicPause",
    },
    "Player paused.",
    {
        description: "Player paused.",
        timestamp: false,
        title: "Paused",
    },
    {},
);

const musicResumePhrase = new MessagePhrase(
    {
        description: "Shown when music is resumed",
        name: "musicResume",
    },
    "Player resumed.",
    {
        description: "Player resumed.",
        timestamp: false,
        title: "Resumed",
    },
    {},
);

const musicVolumePhrase = new MessagePhrase(
    {
        description: "Shown when the volume is changed",
        name: "musicVolume",
    },
    "Volume changed to {volume} %.",
    {
        description: "Volume changed to {volume} %.",
        timestamp: false,
        title: "Volume changed",
    },
    {
        volume: "The new volume",
    },
);

const musicStopPhrase = new MessagePhrase(
    {
        description: "Shown when music is stopped",
        name: "musicStop",
    },
    "Player stopped.",
    {
        description: "Player stopped.",
        timestamp: false,
        title: "Stopped",
    },
    {},
);

export function getCommand(player: PlayerModule) {
    const musicPlayCommand = new SimpleCommand(
        {
            allowedPrivileges: ["everyone"],
            author: "extcord",
            description: "Play some music",
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
        ] as const,
        async (context) => {
            const voiceChannel = context.message.member.member.voice.channel;
            if (!voiceChannel) {
                return context.respond(musicNoVoicePhrase, {});
            }
            let url = context.arguments[0];
            let searched = false;
            if (!isValidUrl(url)) {
                searched = true;
                const respondPromise = context.respond(musicSearchingPhrase, { search: url });
                const searchResult = await ytsr(url, {
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
                await respondPromise;
                if (resultUrl === undefined || resultItem === undefined) {
                    return context.respond(musicNotFoundPhrase, { search: url });
                }
                url = resultUrl;
                await context.respond(musicPlayPhrase, {
                    author: resultItem.author?.name ?? "",
                    authorIconUrl: resultItem.author?.avatars[0].url ?? "",
                    authorUrl: resultItem.author?.url ?? "",
                    duration: resultItem.duration ?? "?",
                    thumbnailUrl: resultItem.thumbnails[0].url ?? "",
                    title: resultItem.title,
                    url: resultItem.url,
                });
            }

            const ytdlResult = ytdl(url, { filter: "audioonly" });
            if (!searched) {
                ytdlResult.once("info", async (video: ytdl.videoInfo, format: ytdl.videoFormat) => {
                    await context.respond(musicPlayPhrase, {
                        author: video.videoDetails.author.name,
                        authorIconUrl: video.videoDetails.author.avatar,
                        authorUrl: video.videoDetails.author.channel_url,
                        duration: video.videoDetails.lengthSeconds,
                        thumbnailUrl: video.videoDetails.thumbnail.thumbnails[0].url,
                        title: video.videoDetails.title,
                        url: video.videoDetails.video_url,
                    });
                });
            }

            const guild = context.message.message.guild!;
            let connection: VoiceConnection;
            if (guild.voice?.channel === voiceChannel && guild.voice.connection) {
                connection = guild.voice.connection;
            } else {
                connection = await voiceChannel.join();
            }
            const dispatcher = connection.play(ytdlResult);
            context.bot.once("stop", () => {
                dispatcher.destroy();
                connection.disconnect();
            });
        },
    );

    const musicPauseCommand = new SimpleCommand(
        {
            allowedPrivileges: ["everyone"],
            author: "extcord",
            description: "Pause the player",
            name: "pause",
        },
        [] as const,
        async (context) => {
            const voiceChannel = context.message.member.member.voice.channel;
            if (!voiceChannel) {
                return context.respond(musicNoVoicePhrase, {});
            }
            const guild = context.message.guild.guild;
            if (guild.voice?.channel !== voiceChannel) {
                return context.respond(musicWrongVoicePhrase, {});
            }
            if (!guild.voice.connection || !guild.voice.connection.dispatcher) {
                return context.respond(musicNotPlayingPhrase, {});
            }
            guild.voice.connection.dispatcher.pause();
            return context.respond(musicPausePhrase, {});
        },
    );

    const musicResumeCommand = new SimpleCommand(
        {
            allowedPrivileges: ["everyone"],
            author: "extcord",
            description: "Resume the player",
            name: "resume",
        },
        [] as const,
        async (context) => {
            const voiceChannel = context.message.member.member.voice.channel;
            if (!voiceChannel) {
                return context.respond(musicNoVoicePhrase, {});
            }
            const guild = context.message.guild.guild;
            if (guild.voice?.channel !== voiceChannel) {
                return context.respond(musicWrongVoicePhrase, {});
            }
            if (!guild.voice.connection || !guild.voice.connection.dispatcher) {
                return context.respond(musicNotPlayingPhrase, {});
            }
            guild.voice.connection.dispatcher.resume();
            return context.respond(musicResumePhrase, {});
        },
    );

    const musicVolumeCommand = new SimpleCommand(
        {
            allowedPrivileges: ["everyone"],
            author: "extcord",
            description: "Change the volume",
            name: "volume",
        },
        [
            new IntArgument(
                {
                    description: "The new volume in percents",
                    name: "volume",
                },
                false,
                1,
                100,
            ),
        ] as const,
        async (context) => {
            const voiceChannel = context.message.member.member.voice.channel;
            if (!voiceChannel) {
                return context.respond(musicNoVoicePhrase, {});
            }
            const guild = context.message.guild.guild;
            if (guild.voice?.channel !== voiceChannel) {
                return context.respond(musicWrongVoicePhrase, {});
            }
            if (!guild.voice.connection || !guild.voice.connection.dispatcher) {
                return context.respond(musicNotPlayingPhrase, {});
            }
            guild.voice.connection.dispatcher.setVolume(context.arguments[0] / 100);
            return context.respond(musicVolumePhrase, {
                volume: context.arguments[0].toString(),
            });
        },
    );

    const musicStopCommand = new SimpleCommand(
        {
            allowedPrivileges: ["everyone"],
            author: "extcord",
            description: "Stop the player",
            name: "stop",
        },
        [] as const,
        async (context) => {
            const voiceChannel = context.message.member.member.voice.channel;
            if (!voiceChannel) {
                return context.respond(musicNoVoicePhrase, {});
            }
            const guild = context.message.guild.guild;
            if (guild.voice?.channel !== voiceChannel) {
                return context.respond(musicWrongVoicePhrase, {});
            }
            if (!guild.voice.connection || !guild.voice.connection.dispatcher) {
                return context.respond(musicNotPlayingPhrase, {});
            }
            guild.voice.connection.dispatcher.destroy();
            guild.voice.connection.disconnect();
            return context.respond(musicStopPhrase, {});
        },
    );

    const musicCommand = new CommandGroup(
        {
            allowedPrivileges: ["everyone"],
            author: "extcord",
            description: "Play music",
            name: "music",
        },
    );

    musicCommand.addSubcommands(
        musicPlayCommand, musicPauseCommand, musicResumeCommand, musicStopCommand, musicVolumeCommand,
    );
    musicCommand.addPhrases(
        musicNoVoicePhrase, musicNotFoundPhrase, musicNotPlayingPhrase,
        musicPausePhrase, musicPlayPhrase, musicSearchingPhrase,
        musicWrongVoicePhrase, musicStopPhrase, musicVolumePhrase,
    );
    return musicCommand;
}
