// extcord module
// requires ffmpeg-static@^5.1.0 @distube/ytdl-core@^4.11.17 @distube/ytsr@^1.1.9 @distube/ytpl@^1.1.1

import {
    AudioPlayerStatus, createAudioPlayer,
    getVoiceConnection, PlayerSubscription, VoiceConnection, VoiceConnectionStatus,
} from "@discordjs/voice";
import { Guild, GatewayIntentBits, VoiceState } from "discord.js";

import { Bot, CommandGroup, ICommandContext, IExtendedGuild, Logger, Module } from "../..";

import { ClearCommand } from "./commands/ClearCommand";
import { LyricsCommand } from "./commands/LyricsCommand";
import { PopCommand } from "./commands/PopCommand";
import { PauseCommand } from "./commands/PauseCommand";
import { PlayCommand } from "./commands/PlayCommand";
import { QueueCommand } from "./commands/QueueCommand";
import { ResumeCommand } from "./commands/ResumeCommand";
import { SeekCommand } from "./commands/SeekCommand";
import { SkipCommand } from "./commands/SkipCommand";
import { StopCommand } from "./commands/StopCommand";
import { VolumeCommand } from "./commands/VolumeCommand";
import {
    musicEmptyPlaylistPhrase,
    musicEnqueueListPhrase,
    musicEnqueuePhrase,
    musicErrorPhrase,
    musicPlayPhrase,
    phrases,
} from "./phrases";
import { PlayerQueue } from "./queue/PlayerQueue";
import { PlayerQueueItem } from "./queue/PlayerQueueItem";
import { ShuffleCommand } from "./commands/ShuffleCommand";

export default class PlayerModule extends Module {
    public musicCommand: CommandGroup;
    private guildQueues: Map<string, PlayerQueue>;
    private subscriptions: Set<PlayerSubscription>;
    private connections: Set<VoiceConnection>;
    private voiceStateUpdateHandler: ((oldState: VoiceState, newState: VoiceState) => void) | undefined;

    constructor(bot: Bot) {
        super(bot, "extcord", "player");
        this.guildQueues = new Map();
        this.subscriptions = new Set();
        this.connections = new Set();
        this.musicCommand = new CommandGroup(
            {
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Play music",
                name: "music",
            },
        );
        this.musicCommand.addSubcommands(
            new PauseCommand(),
            new PlayCommand(this),
            new ResumeCommand(),
            new SkipCommand(this),
            new StopCommand(this),
            new VolumeCommand(),
            new QueueCommand(this),
            new LyricsCommand(this),
            new ClearCommand(this),
            new SeekCommand(this),
            new PopCommand(this),
            new ShuffleCommand(this),
        );
        this.musicCommand.addPhrases(...phrases);
        this.registerCommand(this.musicCommand);
        bot.once("stop", () => this.onStop());
        bot.on("ready", () => this.onReady());
        bot.on("joinVoice", (guild, options) => {
            options.selfMute = false;
        });

        bot.intents.push(GatewayIntentBits.GuildVoiceStates);
    }

    public getQueue(guild: IExtendedGuild): PlayerQueue {
        let queue = this.guildQueues.get(guild.guild.id);

        if (queue === undefined) {
            queue = new PlayerQueue(guild);
            this.guildQueues.set(guild.guild.id, queue);
        }

        return queue;
    }

    public popQueue(guild: Guild): PlayerQueueItem | undefined {
        const queue = this.guildQueues.get(guild.id);
        return queue?.pop();
    }

    public clearQueue(guild: Guild) {
        this.guildQueues.get(guild.id)?.clear();
    }

    public shuffleQueue(guild: Guild) {
        this.guildQueues.get(guild.id)?.shuffle();
    }

    public async play(
        context: ICommandContext,
        connection: VoiceConnection,
        item: PlayerQueueItem,
        bitrate: number,
        subscription?: PlayerSubscription,
        seek: number = 0,
    ) {
        await this.playInner(context, connection, item, bitrate, subscription, seek);
        return context.respond(musicPlayPhrase, item.details);
    }

    public async seek(context: ICommandContext, connection: VoiceConnection, bitrate: number, seek: number) {
        const queue = this.getQueue(context.guild);
        if (queue.playing === undefined) {
            throw new Error("Nothing is playing");
        }

        if (connection.state.status === VoiceConnectionStatus.Ready) {
            await this.playInner(context, connection, queue.playing, bitrate, connection.state.subscription, seek);
        }
    }

    public async playOrEnqueue(
        context: ICommandContext,
        connection: VoiceConnection,
        items: PlayerQueueItem[],
        bitrate: number,
    ) {
        if (items.length === 0) {
            return context.respond(musicEmptyPlaylistPhrase, {});
        }
        const queue = this.getQueue(context.guild);
        if (
            connection.state.status === VoiceConnectionStatus.Ready
            && connection.state.subscription
            && connection.state.subscription.player.state.status !== AudioPlayerStatus.Idle
        ) {
            for (const item of items) {
                queue.enqueue(item);
            }
            if (items.length === 1) {
                return context.respond(musicEnqueuePhrase, items[0].details);
            } else {
                return context.respond(musicEnqueueListPhrase, {});
            }
        } else {
            let first = true;
            for (const item of items) {
                if (first) {
                    await this.play(context, connection, items[0], bitrate);
                    first = false;
                } else {
                    queue.enqueue(item);
                }
            }
            if (items.length === 2) {
                return context.respond(musicEnqueuePhrase, items[1].details);
            } else if (items.length > 2) {
                return context.respond(musicEnqueueListPhrase, {});
            }
        }
    }

    public disconnect(guild: Guild) {
        const connection = getVoiceConnection(guild.id);
        if (connection) {
            if (connection.state.status === VoiceConnectionStatus.Ready && connection.state.subscription) {
                this.clearQueue(guild);
            }
            connection.disconnect();
        }
    }

    private async playInner(
        context: ICommandContext,
        connection: VoiceConnection,
        item: PlayerQueueItem,
        bitrate: number,
        subscription?: PlayerSubscription,
        seek: number = 0,
    ) {
        const queue = this.getQueue(context.guild);

        if (subscription === undefined) {
            const player = createAudioPlayer();
            subscription = connection.subscribe(player);

            player.on(AudioPlayerStatus.Idle, () => {
                this.nextItem(queue, context, connection, bitrate, subscription);
            });

            player.on("error", (error) => {
                context.respond(musicErrorPhrase, {
                    error: `${error.name}: ${error.message}`,
                });
                this.nextItem(queue, context, connection, bitrate, subscription);
            });

            if (typeof subscription === "undefined") {
                queue.playing = undefined;
                return;
            }

            this.subscriptions.add(subscription);
            this.connections.add(connection);
        }

        const resource = await item.getResource();
        resource.playbackDuration = seek * 1000;
        resource.encoder?.setBitrate(bitrate);
        subscription.player.play(resource);
        queue.subscription = subscription;
        queue.playing = item;
    }

    private nextItem(
        queue: PlayerQueue,
        context: ICommandContext,
        connection: VoiceConnection,
        bitrate: number,
        subscription?: PlayerSubscription,
    ) {
        const newItem = queue.dequeue();
        queue.playing = newItem;
        if (newItem) {
            this.play(context, connection, newItem, bitrate, subscription).catch((err) => {
                queue.playing = undefined;
                queue.subscription = undefined;
                Logger.error(`Error advancing player queue: ${err}`);
            });
        }
    }

    private onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
        const botMember = oldState.channel?.members.get(this.bot.client!.user!.id);
        if (botMember === undefined) {
            return;
        }
        if (newState.channel !== null) {
            return;
        }
        const channel = oldState.channel!;
        if (channel.members.size === 1) {
            setTimeout(() => {
                if (channel.members.size === 1) {
                    this.disconnect(botMember.guild);
                }
            }, 5000);
        }
    }

    private onReady() {
        if (this.voiceStateUpdateHandler !== undefined) {
            this.bot.client!.removeListener("voiceStateUpdate", this.voiceStateUpdateHandler);
        }
        this.voiceStateUpdateHandler =
            (oldState: VoiceState, newState: VoiceState) => this.onVoiceStateUpdate(oldState, newState);
        this.bot.client!.on("voiceStateUpdate", this.voiceStateUpdateHandler);
    }

    private onStop() {
        for (const subscription of this.subscriptions) {
            subscription.player.stop();
        }
        for (const connection of this.connections) {
            connection.disconnect();
        }
    }
}
