import { AudioPlayer, createAudioPlayer, entersState, getVoiceConnection, joinVoiceChannel, NoSubscriberBehavior, PlayerSubscription, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { Guild, VoiceChannel, VoiceState } from "discord.js";
import { Bot } from "../Bot";
import { Logger } from "..";

/**
 * The bot's handler for voice connections.
 * @category Voice
 */
export class Voice {
    private bot: Bot;
    private guildSubscriptions: Map<string, PlayerSubscription>;
    private guildPlayers: Map<string, Map<string, AudioPlayer>>;
    private guildPlayerStacks: Map<string, AudioPlayer[]>;

    constructor(bot: Bot) {
        this.bot = bot;
        this.guildSubscriptions = new Map();
        this.guildPlayers = new Map();
        this.guildPlayerStacks = new Map();
    }

    public getConnection(guild: Guild): VoiceConnection | undefined {
        return getVoiceConnection(guild.id);
    }

    /** Get an existing voice connection, or join the voice channel if one doesn't exist */
    public async getOrCreateConnection(voiceChannel: VoiceChannel, options?: Partial<IVoiceJoinOptions>): Promise<VoiceConnection> {
        const connection = getVoiceConnection(voiceChannel.guildId);

        if (connection !== undefined) {
            if (connection.joinConfig.channelId === voiceChannel.id) {
                return connection;
            } else {
                connection.disconnect();
            }
        }

        const baseOptions = {
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
        };

        const additionalOptions = Object.assign({
            selfDeaf: true,
            selfMute: true,
        }, options);

        this.bot.emit("joinVoice", voiceChannel.guild, additionalOptions);

        const newConnection = joinVoiceChannel(Object.assign(baseOptions, additionalOptions));

        newConnection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
            try {
                await Promise.race([
                    entersState(newConnection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(newConnection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
                // Seems to be reconnecting to a new channel - ignore disconnect
            } catch (error) {
                // Seems to be a real disconnect which SHOULDN'T be recovered from
                if (newConnection.state.status !== VoiceConnectionStatus.Destroyed) {
                    newConnection.destroy();
                }

                this.guildSubscriptions.get(voiceChannel.guildId)?.unsubscribe();
                this.guildSubscriptions.delete(voiceChannel.guildId);
                this.guildPlayerStacks.delete(voiceChannel.guildId);
            }
        });

        await entersState(newConnection, VoiceConnectionStatus.Ready, 10e3);

        return newConnection;
    }

    public getGuildPlayer(guild: Guild, playerId: string): AudioPlayer | undefined {
        return this.guildPlayers.get(guild.id)?.get(playerId);
    }

    public getOrCreateGuildPlayer(guild: Guild, playerId: string): AudioPlayer {
        const player = this.getGuildPlayer(guild, playerId);

        if (player !== undefined) {
            return player;
        }

        const newPlayer = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            }
        });

        let guildPlayers = this.guildPlayers.get(guild.id);
        if (guildPlayers === undefined) {
            guildPlayers = new Map();
            this.guildPlayers.set(guild.id, guildPlayers);
        }

        guildPlayers.set(playerId, newPlayer);

        return newPlayer;
    }

    public removeGuildPlayer(guild: Guild, playerId: string): boolean {
        this.dequeuePlayer(guild, playerId);

        return this.guildPlayers.get(guild.id)?.delete(playerId) ?? false;
    }

    public dequeuePlayer(guild: Guild, playerId: string): boolean {
        const stack = this.guildPlayerStacks.get(guild.id);
        const player = this.getGuildPlayer(guild, playerId);

        if (stack === undefined || player === undefined) {
            return false;
        }

        const newStack = stack.filter(stackPlayer => stackPlayer !== player);
        this.guildPlayerStacks.set(guild.id, newStack);

        const currentSubscription = this.guildSubscriptions.get(guild.id);
        if (currentSubscription !== undefined && currentSubscription.player === player) {
            this.changeSubscription(guild);
        }

        return true;
    }

    public queuePlayer(guild: Guild, playerId: string, top: boolean = false): boolean {
        const player = this.getGuildPlayer(guild, playerId);
        if (player === undefined) {
            return false;
        }

        let connection = this.getConnection(guild);
        if (connection === undefined) {
            return false;
        }

        let stack = this.guildPlayerStacks.get(guild.id);
        if (stack === undefined) {
            stack = [];
            this.guildPlayerStacks.set(guild.id, stack);
        }

        if (stack.includes(player)) {
            return false;
        }

        if (top) {
            stack.push(player);
            this.changeSubscription(guild);
        } else {
            stack.unshift(player);
            if (stack.length === 1) {
                this.changeSubscription(guild);
            }
        }

        return true;
    }

    public isPlayerQueued(guild: Guild, playerId: string): boolean {
        const player = this.getGuildPlayer(guild, playerId);
        if (player === undefined) {
            return false;
        }

        let connection = this.getConnection(guild);
        if (connection === undefined) {
            return false;
        }

        return this.guildPlayerStacks.get(guild.id)?.includes(player) ?? false;
    }

    public disconnect(guild: Guild) {
        const connection = this.getConnection(guild);

        if (connection === undefined) {
            return;
        }

        this.bot.emit("disconnectVoice", guild);
        connection.disconnect();
    }

    public onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
        if (oldState.member?.id === this.bot.client!.user!.id) {
            // If the voice state update concerns bot, check if bot was moved to an empty channel
            const channel = newState.channel;

            if (channel === null) {
                return;
            }

            if (channel.members.size === 1) {
                setTimeout(() => {
                    if (channel.members.size === 1) {
                        this.disconnect(channel.guild);
                    }
                }, 5000);
            }

            return;
        }

        const botMember = oldState.channel?.members.get(this.bot.client!.user!.id);
        if (botMember === undefined) {
            return;
        }
        if (newState.channel === oldState.channel) {
            return;
        }
        const channel = oldState.channel!;
        if (channel.members.size === 1) {
            setTimeout(() => {
                if (channel.members.size === 1) {
                    this.disconnect(channel.guild);
                }
            }, 5000);
        }
    }

    private changeSubscription(guild: Guild) {
        const currentSubscription = this.guildSubscriptions.get(guild.id);
        if (currentSubscription !== undefined) {
            Logger.debug(`Unsubscribing current subscriber`);
            currentSubscription.unsubscribe();
        }

        let stack = this.guildPlayerStacks.get(guild.id);
        if (stack === undefined) {
            stack = [];
            this.guildPlayerStacks.set(guild.id, stack);
        }

        const newPlayer = stack.at(-1);
        const connection = this.getConnection(guild);

        if (newPlayer !== undefined && connection !== undefined) {
            Logger.debug(`Subscribing new subscription`);
            const subscription = connection.subscribe(newPlayer);

            if (subscription !== undefined) {
                this.guildSubscriptions.set(guild.id, subscription);
                Logger.debug(`Subscribed new subscription`);
                return;
            }
        }

        this.guildSubscriptions.delete(guild.id);
    }
}

/**
 * Options for joining a voice channel.
 */
export interface IVoiceJoinOptions {
    selfDeaf: boolean,
    selfMute: boolean,
}
