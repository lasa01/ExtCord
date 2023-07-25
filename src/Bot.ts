import { EventEmitter } from "events";
import { createInterface, ReadLine } from "readline";

import { Client, Guild, GatewayIntentBits, VoiceChannel } from "discord.js";
export { VoiceConnectionStatus } from "@discordjs/voice";
import { entersState, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { transports } from "winston";

import { Commands } from "./commands/Commands";
import { Config } from "./config/Config";
import { ConfigEntryGroup } from "./config/entry/ConfigEntryGroup";
import { NumberConfigEntry } from "./config/entry/NumberConfigEntry";
import { StringConfigEntry } from "./config/entry/StringConfigEntry";
import { Database } from "./database/Database";
import { Languages } from "./language/Languages";
import { Modules } from "./modules/Modules";
import { Permissions } from "./permissions/Permissions";
import { Logger } from "./util/Logger";

// Event definitions
// tslint:disable-next-line:interface-name
export interface Bot {
    /** @event */
    addListener(event: "ready" | "stop", listener: () => void): this;

    /** @event */
    addListener(event: "joinVoice", listener: (guild: Guild, options: IVoiceJoinOptions) => void): this;

    /** @event */
    emit(event: "ready" | "stop"): boolean;

    /** @event */
    emit(event: "joinVoice", guild: Guild, options: IVoiceJoinOptions): boolean;

    /** @event */
    on(event: "ready" | "stop", listener: () => void): this;

    /** @event */
    on(event: "joinVoice", listener: (guild: Guild, options: IVoiceJoinOptions) => void): this;

    /** @event */
    once(event: "ready" | "stop", listener: () => void): this;

    /** @event */
    once(event: "joinVoice", listener: (guild: Guild, options: IVoiceJoinOptions) => void): this;

    /** @event */
    prependListener(event: "ready" | "stop", listener: () => void): this;

    /** @event */
    prependListener(event: "joinVoice", listener: (guild: Guild, options: IVoiceJoinOptions) => void): this;

    /** @event */
    prependOnceListener(event: "ready" | "stop", listener: () => void): this;

    /** @event */
    prependOnceListener(event: "joinVoice", listener: (guild: Guild, options: IVoiceJoinOptions) => void): this;
}

/**
 * The Discord bot handler.
 */
export class Bot extends EventEmitter {
    /** The readline for console input. */
    public readline?: ReadLine;
    /** The Discord client of the bot. */
    public client?: Client;
    /** The config manager of the bot. */
    public config: Config;
    /** The database manager of the bot. */
    public database: Database;
    /** The permission manager of the bot. */
    public permissions: Permissions;
    /** The command handler of the bot. */
    public commands: Commands;
    /** The language handler of the bot. */
    public languages: Languages;
    /** The module handler of the bot. */
    public modules: Modules;
    /** The Discord gateway intents the bot needs to function */
    public intents: GatewayIntentBits[];
    private configEntries: {
        loggerGroup?: ConfigEntryGroup, clientGroup?: ConfigEntryGroup,
        logger: {
            file: StringConfigEntry,
            loglevel: StringConfigEntry,
        },
        client: {
            messageCacheLifetime: NumberConfigEntry,
            messageCacheSweepInterval: NumberConfigEntry,
            token: StringConfigEntry,
        },
    };

    /**
     * Creates a new bot.
     * @param configFile The path to the bot configuration file.
     */
    constructor(configFile: string) {
        super();
        this.config = new Config(configFile);
        this.configEntries = {
            client: {
                messageCacheLifetime: new NumberConfigEntry({
                    description: "How long a message should stay in the cache (in seconds, 0 for forever)",
                    name: "messageCacheLifetime",
                }, 0),
                messageCacheSweepInterval: new NumberConfigEntry({
                    description: "How frequently to remove messages from the cache (in seconds, 0 for never)",
                    name: "messageCacheSweepInterval",
                }, 0),
                token: new StringConfigEntry({
                    description: "Discord login token",
                    name: "token",
                }, ""),
            },
            logger: {
                file: new StringConfigEntry({
                    description: "Log filename",
                    name: "file",
                }, "bot.log"),
                loglevel: new StringConfigEntry({
                    description: "Log level",
                    name: "loglevel",
                }, "info"),
            },
        };
        this.configEntries.loggerGroup = new ConfigEntryGroup({
            description: "Winston logger configuration",
            loadStage: 0,
            name: "logger",
        }, Object.values(this.configEntries.logger));
        this.configEntries.clientGroup = new ConfigEntryGroup({
            description: "Discord client configuration",
            name: "client",
        }, Object.values(this.configEntries.client));
        this.config.registerEntry(this.configEntries.loggerGroup);
        this.config.registerEntry(this.configEntries.clientGroup);
        this.database = new Database();
        this.database.registerConfig(this.config);
        Config.registerDatabase(this.database);
        this.permissions = new Permissions(this.database);
        this.languages = new Languages(this.database);
        this.languages.registerConfig(this.config);
        this.commands = new Commands(this);
        this.commands.registerConfig();
        this.commands.registerDatabase();
        this.modules = new Modules(this);
        this.modules.registerConfig();

        this.intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages];
    }

    /** Starts the bot. */
    public async run() {
        Logger.debug(`Processor architecture: ${process.arch}`);
        Logger.debug(`Command line: ${process.argv}`);
        Logger.debug(`Working directory: ${process.cwd()}`);
        Logger.debug(`Platform: ${process.platform}`);
        Logger.debug(`Node.js version: ${process.version}`);
        Logger.verbose("Loading config");
        while (this.config.hasNext()) {
            const stage = await this.config.loadNext();
            if (stage === 0) {
                Logger.debug("Reconfiguring logger");
                Logger.get().configure({
                    level: Logger.get().level === "info" ?
                        this.configEntries.logger.loglevel.get() : Logger.get().level,
                    transports: [
                        new transports.Console(),
                        new transports.File({ filename: this.configEntries.logger.file.get() }),
                    ],
                });
                await this.commands.registerCommands();
                await this.modules.loadAll();
                this.commands.registerPermissions();
                this.commands.registerLanguages();
                this.permissions.registerConfig(this.config);
                this.permissions.registerLanguages(this.languages);
                await this.permissions.loadAllPrivileges();
                await this.languages.loadAll();
                Logger.debug(this.permissions.getStatus());
                Logger.debug(this.commands.getStatus());
                Logger.debug(this.languages.getStatus());
            } else if (stage === 1) {
                await this.database.connect();

                this.client = new Client({
                    intents: this.intents,
                });
                Logger.info("Connecting to Discord");
                await this.client.login(this.configEntries.client.token.get());
                Logger.info(`Logged in as "${this.client.user!.username}" (id ${this.client.user!.id})`);
                this.emit("ready");

                this.client.on("messageCreate", async (message) => {
                    await this.commands.message(message);
                });

                this.client.on("interactionCreate", async (interaction) => {
                    await this.commands.interaction(interaction);
                });
            }
        }
    }

    /** Reloads the bot */
    public async reload() {
        await this.modules.reload();
        await this.config.reload();
        await this.permissions.reload();
        await this.languages.reload();
        await this.database.reload();
        this.commands.reload();
    }

    /**
     * Sets the bot into interactive mode, accepting commands from a stream.
     * @param input The stream to accept commands from.
     */
    public setInteractive(input: NodeJS.ReadableStream) {
        this.readline = createInterface({
            input,
        });
        this.readline.on("line", (line: string) => {
            this.input(line.trim());
        });
        this.readline.on("SIGINT", () => {
            this.stop();
        });
    }

    /**
     * Sends a command to the bot.
     * @param input The command to send.
     */
    public input(input: string) {
        switch (input) {
            case "stop":
                this.stop();
                break;
            default:
                Logger.warn("Type \"stop\" to stop the bot. Other commands are not (yet) supported.");
        }
    }

    /** Stops the bot from running. */
    public async stop() {
        Logger.info("Bot stopping");
        this.emit("stop");
        const promises = [this.database.stop()];
        if (this.client) {
            this.client.destroy();
        }
        if (this.readline) {
            this.readline.close();
        }
        await Promise.all(promises);
    }

    /** Join a voice channel  */
    public async joinVoice(voiceChannel: VoiceChannel, options?: Partial<IVoiceJoinOptions>): Promise<VoiceConnection> {
        const baseOptions = {
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
        };

        const additionalOptions = Object.assign({
            selfDeaf: true,
            selfMute: true,
        }, options);

        this.emit("joinVoice", voiceChannel.guild, additionalOptions);

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
                newConnection.destroy();
            }
        });

        await entersState(newConnection, VoiceConnectionStatus.Ready, 10e3);

        return newConnection;
    }
}

/**
 * Options for joining a voice channel.
 */
export interface IVoiceJoinOptions {
    selfDeaf: boolean,
    selfMute: boolean,
}
