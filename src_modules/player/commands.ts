import { URL } from "url";
import { CommandGroup, MessagePhrase, SimpleCommand, StringArgument } from "../..";

import ytdl = require("ytdl-core");

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
        description: "Playing `{title}`.",
        timestamp: false,
        title: "Playing",
    },
    {
        title: "Title of what is being played",
    },
);

const musicUrlInvalidPhrase = new MessagePhrase(
    {
        description: "Shown when url is invalid",
        name: "musicUrlInvalid",
    },
    "The url `{url}` is not valid.",
    {
        description: "The url `{url}` is not valid.",
        timestamp: false,
        title: "Invalid url",
    },
    {
        url: "Url of the music",
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
        title: "Playing failed",
    },
    {},
);

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
        ),
    ] as const,
    async (context) => {
        const voiceChannel = context.message.member.member.voice.channel;
        if (!voiceChannel) {
            return context.respond(musicNoVoicePhrase, {});
        }
        const connection = await voiceChannel.join();
        const url = context.arguments[0];
        if (!isValidUrl(url)) {
            return context.respond(musicUrlInvalidPhrase, { url });
        }

        const ytdlResult = ytdl(url, { filter: "audioonly" });
        ytdlResult.on("info", async (video: ytdl.videoInfo, format: ytdl.videoFormat) => {
            await context.respond(musicPlayPhrase, {
                title: video.videoDetails.title,
            });
        });
        connection.play(ytdlResult);
    },
);

export const musicCommand = new CommandGroup(
    {
        allowedPrivileges: ["everyone"],
        author: "extcord",
        description: "Play music",
        name: "music",
    },
);

musicCommand.addSubcommands(musicPlayCommand);
musicCommand.addPhrases(musicNoVoicePhrase, musicUrlInvalidPhrase, musicPlayPhrase);
