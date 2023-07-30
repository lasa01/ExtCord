import { DynamicFieldMessagePhrase, MessagePhrase } from "../..";

export const musicPlayPhrase = new MessagePhrase(
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

export const musicEnqueuePhrase = new MessagePhrase(
    {
        description: "Shown when something is queued",
        name: "musicEnqueue",
    },
    "Queued `{title}`.",
    {
        author: {
            iconUrl: "{authorIconUrl}",
            name: "{author}",
            url: "{authorUrl}",
        },
        description: "Duration: {duration} s",
        thumbnailUrl: "{thumbnailUrl}",
        timestamp: false,
        title: "Queued {title}",
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

export const musicEnqueueListPhrase = new MessagePhrase(
    {
        description: "Shown when a playlist is queued",
        name: "musicEnqueueList",
    },
    "Queued playlist.",
    {
        timestamp: false,
        title: "Queued playlist",
    },
    {},
);

export const musicSearchingPhrase = new MessagePhrase(
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

export const musicNotFoundPhrase = new MessagePhrase(
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

export const musicNoVoicePhrase = new MessagePhrase(
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

export const musicWrongVoicePhrase = new MessagePhrase(
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

export const musicNotPlayingPhrase = new MessagePhrase(
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

export const musicEmptyPlaylistPhrase = new MessagePhrase(
    {
        description: "Shown when trying to play an empty playlist",
        name: "musicEmptyPlaylist",
    },
    "The playlist is empty.",
    {
        description: "The playlist is empty.",
        timestamp: false,
        title: "Empty playlist",
    },
    {},
);

export const musicPausePhrase = new MessagePhrase(
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

export const musicResumePhrase = new MessagePhrase(
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

export const musicVolumePhrase = new MessagePhrase(
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

export const musicStopPhrase = new MessagePhrase(
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

export const musicSkipPhrase = new MessagePhrase(
    {
        description: "Shown when music is skipped",
        name: "musicSkip",
    },
    "Skipped `{title}`.",
    {
        author: {
            iconUrl: "{authorIconUrl}",
            name: "{author}",
            url: "{authorUrl}",
        },
        thumbnailUrl: "{thumbnailUrl}",
        timestamp: false,
        title: "Skipped {title}",
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

export const musicQueuePhrase = new DynamicFieldMessagePhrase(
    {
        description: "Shown when the player queue is requested",
        name: "musicQueue",
    },
    "Currently playing `{title}`.\nQueue:",
    {
        author: {
            iconUrl: "{authorIconUrl}",
            name: "{author}",
            url: "{authorUrl}",
        },
        description: "Queue:",
        thumbnailUrl: "{thumbnailUrl}",
        timestamp: false,
        title: "Currently playing {title}",
        url: "{url}",
    },
    "`{title}` by {author}",
    {
        inline: false,
        name: "{title} by {author}",
        value: "Duration: {duration} s",
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
    {
        author: "The author of what will be played",
        authorIconUrl: "The url of the author's icon",
        authorUrl: "The url of the author",
        duration: "The duration of what will be played.",
        thumbnailUrl: "The url of the thumbnail",
        title: "Title of what will be played",
        url: "The url of what will be played",
    },
);

export const musicLyricsPhrase = new MessagePhrase(
    {
        description: "Shown when lyrics are requested",
        name: "musicLyrics",
    },
    "Lyrics for `{title}`:\n{lyrics}",
    {
        author: {
            name: "{author}",
        },
        description: "{lyrics}",
        thumbnailUrl: "{thumbnailUrl}",
        timestamp: false,
        title: "Lyrics for {title}",
        url: "{url}",
    },
    {
        author: "The author of the lyrics",
        lyrics: "The lyrics",
        thumbnailUrl: "The url of the thumbnail",
        title: "Title of the lyrics",
        url: "The url of the lyrics",
    },
);

export const musicLyricsNotFoundPhrase = new MessagePhrase(
    {
        description: "Shown when requested lyrics are not found",
        name: "musicLyricsNotFound",
    },
    "Could not find lyrics for `{title}`",
    {
        description: "Could not find lyrics for `{title}`",
        timestamp: false,
        title: "Lyrics not found",
    },
    {
        title: "Title of the lyrics",
    },
);

export const musicLyricsErrorPhrase = new MessagePhrase(
    {
        description: "Shown when requested lyrics could not be fetched",
        name: "musicLyricsError",
    },
    "Lyrics provider had problems fetching lyrics for `{title}`",
    {
        description: "The lyrics provider had problems fetching lyrics for `{title}`",
        timestamp: false,
        title: "Could not fetch lyrics",
    },
    {
        title: "Title of the lyrics",
    },
);

export const musicLyricsRateLimitedPhrase = new MessagePhrase(
    {
        description: "Shown when the lyrics request gets rate limited",
        name: "musicLyricsRateLimited",
    },
    "Too many lyrics requests",
    {
        description: "Try again later",
        timestamp: false,
        title: "Too many lyrics requests",
    },
    {},
);

export const musicClearPhrase = new MessagePhrase(
    {
        description: "Shown when the music queue is cleared",
        name: "musicClear",
    },
    "Queue cleared.",
    {
        description: "Queue cleared.",
        timestamp: false,
        title: "Cleared",
    },
    {},
);

export const musicSeekPhrase = new MessagePhrase(
    {
        description: "Shown when the player is seeked",
        name: "musicSeek",
    },
    "Seeked to {seconds} s.",
    {
        description: "Seeked to {seconds} s.",
        timestamp: false,
        title: "Seeked",
    },
    {
        seconds: "seconds",
    },
);

export const musicErrorPhrase = new MessagePhrase(
    {
        description: "Shown when the player encounters an error",
        name: "musicError",
    },
    "Music playing failed: `{error}`",
    {
        description: "Music playing failed: `{error}`",
        timestamp: false,
        title: "Music playing failed",
    },
    {
        error: "the error that was encountered",
    },
);

export const musicPopPhrase = new MessagePhrase(
    {
        description: "Shown when the last item is removed from the queue",
        name: "musicPop",
    },
    "Last item removed from the queue.",
    {
        description: "Last item removed from the queue.",
        timestamp: false,
        title: "Item removed",
    },
    {},
);

export const musicEmptyQueuePhrase = new MessagePhrase(
    {
        description: "Shown when the queue is empty",
        name: "musicEmptyQueue",
    },
    "The queue is empty.",
    {
        description: "The queue is empty.",
        timestamp: false,
        title: "Empty queue",
    },
    {},
);

export const musicShufflePhrase = new MessagePhrase(
    {
        description: "Shown when the queue is shuffled",
        name: "musicShuffle",
    },
    "Queue shuffled.",
    {
        description: "Queue shuffled.",
        timestamp: false,
        title: "Shuffled",
    },
    {},
);

export const musicYoutubeErrorPhrase = new MessagePhrase(
    {
        description: "Shown when getting queue item from YouTube URL fails",
        name: "musicYoutubeError",
    },
    "Failed to get queue item from YouTube URL: `{url}`",
    {
        description: "Failed to get queue item from YouTube URL: `{url}`",
        timestamp: false,
        title: "YouTube Error",
    },
    {
        url: "The YouTube URL",
    },
);

export const musicUnsupportedUrlPhrase = new MessagePhrase(
    {
        description: "Shown when the URL is unsupported",
        name: "musicUnsupportedUrl",
    },
    "The URL is unsupported: `{url}`",
    {
        description: "The URL is unsupported: `{url}`",
        timestamp: false,
        title: "Unsupported URL",
    },
    {
        url: "The unsupported URL",
    },
);

export const musicPlaylistErrorPhrase = new MessagePhrase(
    {
        description: "Shown when getting playlist from YouTube URL fails",
        name: "musicPlaylistError",
    },
    "Failed to get queue item from YouTube URL: `{url}`",
    {
        description: "Failed to get playlist from YouTube URL: `{url}`",
        timestamp: false,
        title: "YouTube Error",
    },
    {
        url: "The YouTube URL",
    },
);

export const phrases = [
    musicNoVoicePhrase, musicNotFoundPhrase, musicNotPlayingPhrase,
    musicPausePhrase, musicPlayPhrase, musicSearchingPhrase,
    musicWrongVoicePhrase, musicStopPhrase, musicVolumePhrase,
    musicEnqueuePhrase, musicEnqueueListPhrase, musicSkipPhrase,
    musicQueuePhrase, musicLyricsPhrase, musicLyricsErrorPhrase,
    musicLyricsNotFoundPhrase, musicLyricsRateLimitedPhrase, musicEmptyPlaylistPhrase,
    musicClearPhrase, musicSeekPhrase, musicErrorPhrase,
    musicPopPhrase, musicEmptyQueuePhrase, musicShufflePhrase,
    musicYoutubeErrorPhrase, musicUnsupportedUrlPhrase
];
