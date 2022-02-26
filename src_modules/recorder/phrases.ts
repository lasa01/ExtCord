import { MessagePhrase } from "../..";

export const voiceJoinPhrase = new MessagePhrase(
    {
        description: "Shown when the voice channel is joined",
        name: "voiceJoin",
    },
    "Joined the voice channel.",
    {
        timestamp: false,
        title: "Joined the voice channel."
    },
    {},
);

export const voiceNoVoicePhrase = new MessagePhrase(
    {
        description: "Shown when user isn't in a voice channel",
        name: "voiceNoVoice",
    },
    "You are not in a voice channel.",
    {
        description: "You are not in a voice channel.",
        timestamp: false,
        title: "No voice channel",
    },
    {},
);

export const voiceClipSavingPhrase = new MessagePhrase(
    {
        description: "Shown when a clip is recorded",
        name: "voiceClipSaving",
    },
    "Saving clip...",
    {
        description: "Duration: {duration} seconds",
        timestamp: false,
        title: "Saving clip...",
    },
    {
        duration: "Clip duration in seconds",
    },
);

export const voiceClipPhrase = new MessagePhrase(
    {
        description: "Shown when a clip is recorded",
        name: "voiceClip",
    },
    "Clip recorded",
    {
        timestamp: false,
        title: "Clip recorded",
    },
    {},
);

export const voiceNotRecordingPhrase = new MessagePhrase(
    {
        description: "Shown when the bot isn't recording",
        name: "voiceNotRecording",
    },
    "Recording hasn't been started.",
    {
        description: "Recording hasn't been started.",
        timestamp: false,
        title: "No recording",
    },
    {},
);

export const phrases = [
    voiceJoinPhrase,
    voiceNoVoicePhrase,
    voiceClipPhrase,
    voiceClipSavingPhrase,
    voiceNotRecordingPhrase,
];
