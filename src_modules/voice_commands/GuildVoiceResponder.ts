import { Guild } from "discord.js";
import { AudioPlayer, AudioPlayerError, AudioPlayerStatus, AudioResource } from "@discordjs/voice";

import { Bot, Logger } from "../..";

import VoiceCommandsModule from ".";

export class GuildVoiceResponder {
    private module: VoiceCommandsModule;
    private bot: Bot;

    private guild: Guild;
    private language: string;

    private player: AudioPlayer;
    private playerQueue: AudioResource[];

    private nextExecutionId: number;
    private usingExecutions: Set<number>;

    public destroyed: boolean;

    constructor(module: VoiceCommandsModule, bot: Bot, guild: Guild, language: string) {
        Logger.debug(`Constructing voice responder`);

        this.module = module;
        this.bot = bot;
        this.guild = guild;
        this.language = language;

        this.player = this.bot.voice.getOrCreateGuildPlayer(guild, this.module.name);
        this.player.setMaxListeners(1000);
        this.playerQueue = [];

        this.player.on(AudioPlayerStatus.Idle, () => this.playerIdle());
        this.player.on("error", (error) => this.playerError(error))

        const playerQueued = this.bot.voice.queuePlayer(guild, this.module.name, true);

        this.destroyed = !playerQueued;

        this.nextExecutionId = 0;
        this.usingExecutions = new Set();
    }

    public beginUse(): number {
        const executionId = this.nextExecutionId;

        this.usingExecutions.add(executionId);
        this.nextExecutionId += 1;

        return executionId;
    }

    public endUse(executionId: number) {
        if (this.usingExecutions.delete(executionId) && this.usingExecutions.size === 0) {
            this.destroy();
        }
    }

    public queueResponse(audioResource: AudioResource): Promise<void> {
        let finishedAfter = this.playerQueue.at(-1);

        if (this.player.state.status === AudioPlayerStatus.Idle) {
            this.player.play(audioResource);
        } else {
            this.playerQueue.push(audioResource);
        }

        return new Promise((resolve, reject) => {
            var finishedAfterEncountered = finishedAfter === undefined;

            const listener = () => {
                if (!finishedAfterEncountered) {
                    if (this.playerQueue[0] === finishedAfter) {
                        finishedAfterEncountered = true;
                    }

                    return;
                }

                if (this.playerQueue[0] !== audioResource) {
                    Logger.debug(`Succesfully played response: finishedAfter: ${finishedAfter?.metadata}, audioResource: ${audioResource.metadata}, next: ${this.playerQueue[0]?.metadata}`);

                    resolve();
                    this.player.off(AudioPlayerStatus.Idle, listener);
                    this.player.off("error", errorListener);
                }
            };
            const errorListener = (err: AudioPlayerError) => {
                reject(err);
                this.player.off(AudioPlayerStatus.Idle, listener);
                this.player.off("error", errorListener);
            };

            this.player.prependListener(AudioPlayerStatus.Idle, listener);
            this.player.prependOnceListener("error", errorListener);
        });
    }

    public destroy() {
        Logger.debug(`Destroying voice responder`);

        this.bot.voice.removeGuildPlayer(this.guild, this.module.name);
        this.player.stop(true);

        this.destroyed = true;
    }

    private playerIdle() {
        const next = this.playerQueue.shift();

        if (next === undefined) {
            return;
        }

        this.player.play(next);
    }

    private playerError(error: AudioPlayerError) {
        Logger.error(`Voice response errored: ${error}`);
        this.playerIdle();
    }
}
