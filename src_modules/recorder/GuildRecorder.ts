import { AudioReceiveStream, EndBehaviorType, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { Guild } from "discord.js";
import { Readable } from "stream";
import prism = require("prism-media");

import { Logger } from "../..";

import RecorderModule from ".";

export class GuildRecorder {
    private guild: Guild;
    private streams: AudioReceiveStream[];
    private replayBuffers: Map<string, IVoicePackets[]>;
    private replayBufferMillis: number;
    private recording: boolean;
    private recorder: RecorderModule;

    constructor(guild: Guild, recorder: RecorderModule) {
        this.guild = guild;
        this.streams = [];
        this.replayBuffers = new Map();
        this.replayBufferMillis = 5 * 60 * 1000; // 5 minutes
        this.recording = false;
        this.recorder = recorder;
    }

    public startRecording(connection: VoiceConnection) {
        if (this.recording) {
            return;
        }
        this.recording = true;
        Logger.debug(`Listening on ${this.guild.id}`)
        this.cleanup();
        const receiver = connection.receiver;

        receiver.speaking.on("start", (userId) => {
            Logger.debug(`User ${userId} speaking`)
            const stream = receiver.subscribe(userId, {
                end: {
                    behavior: EndBehaviorType.AfterInactivity,
                    duration: 100,
                }
            });
            this.streams.push(stream);

            let packets: Buffer[] = [];
            let startMillis = Date.now();

            stream.on("data", (chunk) => {
                packets.push(chunk);
            });

            stream.on("close", () => {
                Logger.debug(`User ${userId} stopped speaking`)
                this.streams.splice(this.streams.indexOf(stream), 1);

                const endMillis = Date.now();

                this.pushBuffer(userId, { startMillis, endMillis, packets });
            });

            stream.on("flush", () => {
                Logger.debug(`Flushing user ${userId}'s stream`);
                const endMillis = Date.now();
                this.pushBuffer(userId, { startMillis, endMillis, packets });

                startMillis = endMillis;
                packets = [];
            });
        });

        connection.on(VoiceConnectionStatus.Disconnected, (oldState, newState) => {
            this.stopRecording();
        });
    }

    public isRecording() {
        return this.recording;
    }

    public async save(seconds: number = 30): Promise<Buffer> {
        this.flushStreams();

        seconds = Math.min(this.replayBufferMillis / 1000, seconds);

        const startMillis = Date.now() - seconds * 1000;

        const data = [];

        for (const [, buffers] of this.replayBuffers) {
            const filtered = buffers.filter((packets) => packets.endMillis > startMillis);
            if (filtered.length !== 0) {
                data.push(filtered);
            }
        }

        const processed = await this.recorder.processor.runTask({
            buffers: data,
            seconds,
            startMillis,
        });

        const transcoderStream = new prism.FFmpeg({
            args: [
                "-f", "s16le",
                "-ar", "48000",
                "-ac", "2",
                "-i", "-",
                "-analyzeduration", "0",
                "-loglevel", "0",
                "-strict", "experimental",
                "-c:a", "opus",
                "-f", "ogg",
            ]
        });
        transcoderStream.end(processed);

        const transcoded = await streamToBuffer(transcoderStream);
        return transcoded;
    }

    private pushBuffer(userId: string, item: IVoicePackets) {
        let replayBuffers: IVoicePackets[];

        if (this.replayBuffers.has(userId)) {
            replayBuffers = this.replayBuffers.get(userId)!;
        } else {
            replayBuffers = [];
            this.replayBuffers.set(userId, replayBuffers);
        }

        const latestMillis = item.endMillis;

        // find first index of data to keep
        const keepIndex = replayBuffers.findIndex((packets) => latestMillis - packets.endMillis < this.replayBufferMillis);
        Logger.debug(`Removing ${keepIndex} old buffers`);
        // delete too old data
        replayBuffers.splice(0, keepIndex === -1 ? undefined : keepIndex);

        replayBuffers.push(item);
    }

    private stopRecording() {
        this.cleanup();
        Logger.debug(`Stopped listening on ${this.guild.id}`);
        this.recording = false;
    }

    private cleanup() {
        for (const stream of this.streams) {
            stream.destroy();
        }
        this.streams = [];
        this.replayBuffers.clear()
    }

    private flushStreams() {
        for (const stream of this.streams) {
            stream.emit("flush");
        }
    }
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const buf: any[] = [];

        stream.on("data", (chunk) => buf.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(buf)));
        stream.on("error", reject);
    });
}

export interface IVoicePackets {
    startMillis: number,
    endMillis: number,
    packets: Buffer[],
}
