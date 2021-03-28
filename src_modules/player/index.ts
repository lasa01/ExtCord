// extcord module
// requires ffmpeg-static ytdl-core ytsr ytpl

import { Guild, StreamDispatcher, VoiceConnection, VoiceState } from "discord.js";

import { Bot, CommandGroup, ICommandContext, IExtendedGuild, Logger, Module } from "../..";

import { ClearCommand } from "./commands/ClearCommand";
import { LyricsCommand } from "./commands/LyricsCommand";
import { PauseCommand } from "./commands/PauseCommand";
import { PlayCommand } from "./commands/PlayCommand";
import { QueueCommand } from "./commands/QueueCommand";
import { ResumeCommand } from "./commands/ResumeCommand";
import { SeekCommand } from "./commands/SeekCommand";
import { SkipCommand } from "./commands/SkipCommand";
import { StopCommand } from "./commands/StopCommand";
import { VolumeCommand } from "./commands/VolumeCommand";
import { musicEmptyPlaylistPhrase, musicEnqueueListPhrase, musicEnqueuePhrase, musicPlayPhrase, phrases } from "./phrases";
import { PlayerQueue } from "./queue/PlayerQueue";
import { PlayerQueueItem } from "./queue/PlayerQueueItem";

export default class PlayerModule extends Module {
    public musicCommand: CommandGroup;
    private guildQueues: Map<string, PlayerQueue>;
    private dispatchers: Set<StreamDispatcher>;
    private connections: Set<VoiceConnection>;
    private voiceStateUpdateHandler: ((oldState: VoiceState, newState: VoiceState) => void) | undefined;

    constructor(bot: Bot) {
        super(bot, "extcord", "player");
        this.guildQueues = new Map();
        this.dispatchers = new Set();
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
        );
        this.musicCommand.addPhrases(...phrases);
        this.registerCommand(this.musicCommand);
        bot.once("stop", () => this.onStop());
        bot.on("ready", () => this.onReady());
    }

    public getQueue(guild: IExtendedGuild): PlayerQueue {
        let queue = this.guildQueues.get(guild.guild.id);

        if (queue === undefined) {
            queue = new PlayerQueue(guild);
            this.guildQueues.set(guild.guild.id, queue);
        }

        return queue;
    }

    public clearQueue(guild: Guild) {
        this.guildQueues.get(guild.id)?.clear();
    }

    public async play(context: ICommandContext, connection: VoiceConnection, item: PlayerQueueItem, seek: number = 0) {
        const queue = this.getQueue(context.message.guild);
        const dispatcher = connection.play(await item.getStream(), {
            seek,
        });
        queue.dispatcher = dispatcher;
        queue.playing = item;

        this.dispatchers.add(dispatcher);
        this.connections.add(connection);

        dispatcher.once("finish", () => {
            this.dispatchers.delete(dispatcher);
            const newItem = queue.dequeue();
            queue.playing = newItem;
            queue.dispatcher = undefined;
            if (newItem) {
                this.play(context, connection, newItem).catch((err) => {
                    queue.playing = undefined;
                    queue.dispatcher = undefined;
                    Logger.error(`Error advancing player queue: ${err}`);
                });
            }
        });

        return context.respond(musicPlayPhrase, item.details);
    }

    public async seek(context: ICommandContext, connection: VoiceConnection, seek: number) {
        const queue = this.getQueue(context.message.guild);
        if (queue.playing === undefined) {
            throw new Error("Nothing is playing");
        }
        const dispatcher = connection.play(await queue.playing.getStream(), {
            seek,
        });
        queue.dispatcher = dispatcher;
        dispatcher.once("finish", () => {
            this.dispatchers.delete(dispatcher);
            const newItem = queue.dequeue();
            queue.playing = newItem;
            queue.dispatcher = undefined;
            if (newItem) {
                this.play(context, connection, newItem).catch((err) => {
                    queue.playing = undefined;
                    queue.dispatcher = undefined;
                    Logger.error(`Error advancing player queue: ${err}`);
                });
            }
        });
    }

    public async playOrEnqueue(context: ICommandContext, connection: VoiceConnection, items: PlayerQueueItem[]) {
        if (items.length === 0) {
            return context.respond(musicEmptyPlaylistPhrase, {});
        }
        const queue = this.getQueue(context.message.guild);
        if (connection.dispatcher) {
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
                    await this.play(context, connection, items[0]);
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
        if (guild.voice?.connection) {
            if (guild.voice.connection.dispatcher) {
                this.clearQueue(guild);
                guild.voice.connection.dispatcher.destroy();
            }
            guild.voice.connection.disconnect();
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
            this.bot.client!.setTimeout(() => {
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
        for (const dispatcher of this.dispatchers) {
            dispatcher.destroy();
        }
        for (const connection of this.connections) {
            connection.disconnect();
        }
    }
}
