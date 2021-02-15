// extcord module
// requires ffmpeg-static ytdl-core ytsr

import { StreamDispatcher, VoiceConnection } from "discord.js";

import { Bot, CommandGroup, ICommandContext, IExtendedGuild, Logger, Module } from "../..";

import { PauseCommand } from "./commands/PauseCommand";
import { PlayCommand } from "./commands/PlayCommand";
import { QueueCommand } from "./commands/QueueCommand";
import { ResumeCommand } from "./commands/ResumeCommand";
import { SkipCommand } from "./commands/SkipCommand";
import { StopCommand } from "./commands/StopCommand";
import { VolumeCommand } from "./commands/VolumeCommand";
import { musicEnqueuePhrase, musicPlayPhrase, phrases } from "./phrases";
import { PlayerQueue } from "./queue/PlayerQueue";
import { PlayerQueueItem } from "./queue/PlayerQueueItem";

export default class PlayerModule extends Module {
    public musicCommand: CommandGroup;
    private guildQueues: Map<string, PlayerQueue>;
    private dispatchers: Set<StreamDispatcher>;
    private connections: Set<VoiceConnection>;

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
        );
        this.musicCommand.addPhrases(...phrases);
        this.registerCommand(this.musicCommand);
        bot.once("stop", () => this.onStop());
    }

    public getQueue(guild: IExtendedGuild): PlayerQueue {
        let queue = this.guildQueues.get(guild.guild.id);

        if (queue === undefined) {
            queue = new PlayerQueue(guild);
            this.guildQueues.set(guild.guild.id, queue);
        }

        return queue;
    }

    public clearQueue(guild: IExtendedGuild) {
        this.guildQueues.get(guild.guild.id)?.clear();
    }

    public async play(context: ICommandContext, connection: VoiceConnection, item: PlayerQueueItem) {
        const queue = this.getQueue(context.message.guild);
        const dispatcher = connection.play(await item.getStream());
        queue.playing = item;

        this.dispatchers.add(dispatcher);
        this.connections.add(connection);

        dispatcher.once("finish", () => {
            this.dispatchers.delete(dispatcher);
            const newItem = queue.dequeue();
            queue.playing = newItem;
            if (newItem) {
                this.play(context, connection, newItem).catch((err) => {
                    queue.playing = undefined;
                    Logger.error(`Error advancing player queue: ${err}`);
                });
            }
        });

        return context.respond(musicPlayPhrase, item.details);
    }

    public async playOrEnqueue(context: ICommandContext, connection: VoiceConnection, item: PlayerQueueItem) {
        if (connection.dispatcher) {
            this.getQueue(context.message.guild).enqueue(item);
            return context.respond(musicEnqueuePhrase, item.details);
        } else {
            return this.play(context, connection, item);
        }
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
