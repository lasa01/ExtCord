import { AudioReceiveStream, EndBehaviorType, VoiceConnection, VoiceConnectionState, VoiceConnectionStatus } from "@discordjs/voice";
import { Guild, VoiceState } from "discord.js";
import { EventEmitter } from "events";

import { Bot, Logger } from "../..";

import VoiceCommandsModule from ".";
import { IAsrResult } from "./VoiceBackendClient";

export class GuildListener extends EventEmitter {
    private module: VoiceCommandsModule;
    private bot: Bot;

    private guild: Guild;
    private language: string;

    private maxQueuedCount: number;

    private streams: AudioReceiveStream[];
    private listening: boolean;

    private userQueues: Map<string, IThrottlePromise[]>;
    private userProcessing: Map<string, boolean>;

    private voiceConnection?: VoiceConnection;
    private speakingStartListener?: (userId: string) => void;
    private disconnectedListener?: (oldState: VoiceConnectionState, newState: VoiceConnectionState) => void;

    constructor(module: VoiceCommandsModule, bot: Bot, guild: Guild, language: string, maxQueuedCount: number) {
        super();

        this.module = module;
        this.bot = bot;
        this.guild = guild;
        this.language = language;
        this.maxQueuedCount = maxQueuedCount;

        this.streams = [];
        this.listening = false;

        this.userQueues = new Map();
        this.userProcessing = new Map();
    }

    public startListening(connection: VoiceConnection) {
        if (this.listening) {
            return;
        }
        this.listening = true;
        this.cleanup();
        const receiver = connection.receiver;

        this.speakingStartListener = (userId) => {
            const stream = receiver.subscribe(userId, {
                end: {
                    behavior: EndBehaviorType.AfterInactivity,
                    duration: this.module.inactivityAfterCommandMillisConfigEntry.get(),
                }
            });
            this.streams.push(stream);

            let packets: Buffer[] = [];
            let startMillis = Date.now();

            stream.on("data", (chunk) => {
                packets.push(chunk);
            });

            stream.once("close", () => {
                this.streams.splice(this.streams.indexOf(stream), 1);

                const endMillis = Date.now();

                this.processVoiceChunk(userId, { startMillis, endMillis, packets })
                    .catch(err => Logger.error(`Error processing voice chunk for user ${userId}: ${err}`));
            });
        };
        receiver.speaking.on("start", this.speakingStartListener);

        this.disconnectedListener = (oldState, newState) => {
            this.stopListening();
        };
        connection.on(VoiceConnectionStatus.Disconnected, this.disconnectedListener);

        this.voiceConnection = connection;
    }

    public isListening() {
        return this.listening;
    }

    private async processVoiceChunk(userId: string, item: IVoicePackets) {
        const length = item.endMillis - item.startMillis;

        if (length > this.module.maxCommandMillisConfigEntry.get()
            || length < this.module.minCommandMillisConfigEntry.get()
            || item.packets.length == 0) {
            return;
        }

        if (await this.shouldThrottleProcessing(userId)) {
            Logger.debug(`Voice commands throttled ASR request for user ${userId}`);
            return;
        }

        this.userProcessing.set(userId, true);

        const member = await this.guild.members.fetch(userId);
        const buffer = encodeOpusPackets(item);

        let asrResult: IAsrResult;

        try {
            asrResult = await this.module.client.fetchAsr(buffer, this.language);
        } catch (err) {
            Logger.error(`Voice commands ASR request failed: ${err}`);
            this.dequeueNextAsrRequest(userId);
            return;
        }

        const shouldRunAccurateAsr = await this.module.voiceCommands.processTranscription(member, asrResult, this.voiceConnection);
        if (shouldRunAccurateAsr) {
            try {
                asrResult = await this.module.client.fetchAsr(buffer, this.language, true);
            } catch (err) {
                Logger.error(`Voice commands accurate ASR request failed: ${err}`);
            }

            await this.module.voiceCommands.processTranscription(member, asrResult, this.voiceConnection, true);
        }

        this.dequeueNextAsrRequest(userId);
    }

    private async shouldThrottleProcessing(userId: string): Promise<boolean> {
        const queue = this.getUserQueue(userId);

        if (!this.userProcessing.get(userId)) {
            return false;
        }

        if (queue.length >= this.maxQueuedCount) {
            for (const throttled of queue.splice(0, queue.length - this.maxQueuedCount + 1)) {
                throttled.resolve(true);
            }
        }

        return new Promise((resolve, reject) => {
            queue.push({
                resolve,
                reject,
            });
        });
    }

    private getUserQueue(userId: string) {
        let queue = this.userQueues.get(userId);

        if (queue === undefined) {
            queue = [];

            this.userQueues.set(userId, queue);
        }

        return queue;
    }

    private dequeueNextAsrRequest(userId: string) {
        const next = this.getUserQueue(userId).shift();

        if (next !== undefined) {
            next.resolve(false);
        } else {
            this.userProcessing.set(userId, false);
        }
    }

    private stopListening() {
        this.cleanup();
        this.listening = false;
    }

    private cleanup() {
        if (this.voiceConnection !== undefined) {
            if (this.speakingStartListener !== undefined) {
                this.voiceConnection.receiver.speaking.off("start", this.speakingStartListener);
            }

            if (this.disconnectedListener !== undefined) {
                this.voiceConnection.off(VoiceConnectionStatus.Disconnected, this.disconnectedListener);
            }

            this.speakingStartListener = undefined;
            this.disconnectedListener = undefined;
            this.voiceConnection = undefined;
        }

        for (const stream of this.streams) {
            stream.destroy();
        }
        this.streams = [];

        for (const queue of this.userQueues.values()) {
            for (const throttle of queue) {
                throttle.resolve(true);
            }
        }

        this.userQueues = new Map();

        this.module.voiceCommands.cleanUp(this.guild);
    }
}

function encodeOpusPackets(packetsData: IVoicePackets): Buffer {
    var bufferLen = 2;

    for (const packet of packetsData.packets) {
        bufferLen += 2 + packet.length;
    }

    const buffer = Buffer.alloc(bufferLen);

    var offset = buffer.writeUInt16LE(packetsData.packets.length, 0);

    for (const packet of packetsData.packets) {
        offset = buffer.writeUint16LE(packet.length, offset);
        offset += packet.copy(buffer, offset);
    }

    if (offset != bufferLen) {
        throw new Error("Buffer size calculation is wrong");
    }

    return buffer;
}

export interface IVoicePackets {
    startMillis: number,
    endMillis: number,
    packets: Buffer[],
}

interface IThrottlePromise {
    resolve: (shouldThrottle: boolean) => void;
    reject: () => void;
};
