// extcord module
// requires ffmpeg-static@^5.2.0 @distube/ytdl-core@^4.15.8 @distube/ytsr@^2.0.4 @distube/ytpl@^1.2.1 spotify-uri@^4.0.0 spotify-url-info@^3.2.18

import {
    AudioPlayer,
    AudioPlayerStatus, VoiceConnection, VoiceConnectionStatus,
} from "@discordjs/voice";
import { Guild, GatewayIntentBits } from "discord.js";

import { Bot, CommandGroup, ICommandContext, IExtendedGuild, Logger, Module } from "../..";

import { ClearCommand } from "./commands/ClearCommand";
import { LyricsCommand } from "./commands/LyricsCommand";
import { PopCommand } from "./commands/PopCommand";
import { PauseCommand } from "./commands/PauseCommand";
import { PlayCommand } from "./commands/PlayCommand";
import { QueueCommand } from "./commands/QueueCommand";
import { ResumeCommand } from "./commands/ResumeCommand";
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
    private connections: Set<VoiceConnection>;

    constructor(bot: Bot) {
        super(bot, "extcord", "player");
        this.guildQueues = new Map();
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
            new PauseCommand(this),
            new PlayCommand(this),
            new ResumeCommand(this),
            new SkipCommand(this),
            new StopCommand(this),
            new VolumeCommand(this),
            new QueueCommand(this),
            new LyricsCommand(this),
            new ClearCommand(this),
            new PopCommand(this),
            new ShuffleCommand(this),
        );
        this.musicCommand.addPhrases(...phrases);
        this.registerCommand(this.musicCommand);
        bot.once("stop", () => this.onStop());
        bot.on("joinVoice", (guild, options) => {
            options.selfMute = false;
        });
        bot.on("disconnectVoice", (guild) => this.onVoiceDisconnect(guild));

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
        seek: number = 0,
    ) {
        await this.playInner(context, connection, item, bitrate, seek);
        return context.respond(musicPlayPhrase, item.details);
    }

    public async seek(context: ICommandContext, connection: VoiceConnection, bitrate: number, seek: number) {
        const queue = this.getQueue(context.guild);
        if (queue.playing === undefined) {
            throw new Error("Nothing is playing");
        }

        if (connection.state.status === VoiceConnectionStatus.Ready) {
            await this.playInner(context, connection, queue.playing, bitrate, seek);
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
        const player = this.getPlayer(context.guild.guild);

        if (
            connection.state.status === VoiceConnectionStatus.Ready
            && player !== undefined
            && player.state.status !== AudioPlayerStatus.Idle
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
        this.bot.voice.disconnect(guild);
    }

    public isPlaying(guild: Guild): boolean {
        const connection = this.bot.voice.getConnection(guild);

        if (connection?.state.status !== VoiceConnectionStatus.Ready) {
            return false;
        }

        return this.bot.voice.isPlayerQueued(guild, this.name);
    }

    public getPlayer(guild: Guild): AudioPlayer | undefined {
        return this.bot.voice.getGuildPlayer(guild, this.name);
    }

    private async playInner(
        context: ICommandContext,
        connection: VoiceConnection,
        item: PlayerQueueItem,
        bitrate: number,
        seek: number = 0,
    ) {
        const queue = this.getQueue(context.guild);

        let player = this.bot.voice.getGuildPlayer(context.guild.guild, this.name);

        if (player === undefined) {
            player = this.bot.voice.getOrCreateGuildPlayer(context.guild.guild, this.name);
            this.bot.voice.queuePlayer(context.guild.guild, this.name);

            player.on(AudioPlayerStatus.Idle, () => {
                this.nextItem(queue, context, connection, bitrate);
            });

            player.on("error", (error) => {
                context.respond(musicErrorPhrase, {
                    error: `${error.name}: ${error.message}`,
                });
                this.nextItem(queue, context, connection, bitrate);
            });

            this.connections.add(connection);
        }

        const resource = await item.getResource();
        resource.encoder?.setBitrate(bitrate);
        player.play(resource);
        queue.playing = item;
    }

    private nextItem(
        queue: PlayerQueue,
        context: ICommandContext,
        connection: VoiceConnection,
        bitrate: number,
    ) {
        const newItem = queue.dequeue();
        queue.playing = newItem;
        if (newItem) {
            this.play(context, connection, newItem, bitrate).catch((err) => {
                queue.playing = undefined;
                Logger.error(`Error advancing player queue: ${err}`);
                this.cleanUp(context.guild.guild);
            });
        } else {
            this.cleanUp(context.guild.guild);
        }
    }

    private cleanUp(guild: Guild) {
        this.bot.voice.removeGuildPlayer(guild, this.name);
    }

    private onVoiceDisconnect(guild: Guild) {
        this.clearQueue(guild);
        this.cleanUp(guild);
    }

    private onStop() {
        for (const connection of this.connections) {
            connection.disconnect();
        }
    }
}
