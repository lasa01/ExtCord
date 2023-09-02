import { MessagePhrase } from "../..";

export const voiceCommandsEnabledPhrase = new MessagePhrase(
    {
        description: "Shown when voice commands are enabled",
        name: "voiceCommandsEnabled",
    },
    "Voice commands enabled.",
    {
        timestamp: false,
        title: "Voice commands enabled."
    },
    {},
);

export const voiceCommandsDisabledPhrase = new MessagePhrase(
    {
        description: "Shown when voice commands are disabled",
        name: "voiceCommandsDisabled",
    },
    "Voice commands disabled.",
    {
        timestamp: false,
        title: "Voice commands disabled."
    },
    {},
);

export const autoJoinEnabledPhrase = new MessagePhrase(
    {
        description: "Shown when automatic joining is enabled",
        name: "autoJoinEnabled",
    },
    "Automatic joining enabled.",
    {
        timestamp: false,
        title: "Automatic joining enabled."
    },
    {},
);

export const autoJoinDisabledPhrase = new MessagePhrase(
    {
        description: "Shown when automatic joining is disabled",
        name: "autoJoinDisabled",
    },
    "Automatic joining disabled.",
    {
        timestamp: false,
        title: "Automatic joining disabled."
    },
    {},
);
