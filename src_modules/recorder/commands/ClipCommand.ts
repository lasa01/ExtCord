import { Command, IExecutionContext, IntArgument } from "../../../dist";

import RecorderModule from "..";
import { voiceNotRecordingPhrase, voiceClipPhrase, voiceNoVoicePhrase, voiceClipSavingPhrase } from "../phrases";
import { VoiceChannel } from "discord.js";

export class ClipCommand extends Command<[IntArgument<true>]> {
    private recorder: RecorderModule;

    public constructor(recorder: RecorderModule) {
        super(
            {
                aliases: ["c"],
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Save a voice clip",
                globalAliases: ["clip", "c"],
                name: "clip",
            },
            [
                new IntArgument(
                    {
                        description: "Clip duration in seconds",
                        name: "duration",
                    },
                    true,
                    1,
                    300,
                )
            ],
        );

        this.recorder = recorder;
    }

    public async execute(context: IExecutionContext<[IntArgument<true>]>) {
        const voiceChannel = context.member.member.voice.channel;

        if (!(voiceChannel instanceof VoiceChannel)) {
            return context.respond(voiceNoVoicePhrase, {});
        }

        const recorder = this.recorder.getRecorder(context.guild.guild);

        if (!recorder.isRecording()) {
            return context.respond(voiceNotRecordingPhrase, {});
        }

        const seconds = context.arguments[0] || 30;

        await context.respond(voiceClipSavingPhrase, { duration: seconds.toString() });

        let name = `${(new Date()).toISOString()}.ogg`;
        name = name.replace(/:/g, ".");
        name = name.replace("T", " ");
        name = name.replace("Z", "");

        const recorded = await recorder.save(seconds);

        return context.respond(voiceClipPhrase, {}, undefined, { files: [{ attachment: recorded, name }] });
    }
}
