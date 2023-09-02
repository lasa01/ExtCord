// extcord module 
// requires fastest-levenshtein@^1.0.16 lru-cache@^10.0.1

import { GatewayIntentBits, Guild, VoiceState, VoiceConnection } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";

import { BooleanGuildConfigEntry, Bot, Logger, Module, SimplePhrase, StringConfigEntry, NumberConfigEntry } from "../..";

import { GuildListener } from "./GuildListener";
import { VoiceBackendClient } from "./VoiceBackendClient";
import { PhoneticCache } from "./PhoneticCache";
import { SpeechCache } from "./SpeechCache";
import { VoiceCommands } from "./VoiceCommands";

export default class VoiceCommandsModule extends Module {
    private listeners: Map<string, GuildListener>;
    public keywordPhrase: SimplePhrase;
    public backendLanguageIdPhrase: SimplePhrase;
    public urlConfigEntry: StringConfigEntry;
    public similarityThresholdConfigEntry: NumberConfigEntry;
    public minCommandCharactersConfigEntry: NumberConfigEntry;
    public minCommandMillisConfigEntry: NumberConfigEntry;
    public maxCommandMillisConfigEntry: NumberConfigEntry;
    public inactivityAfterCommandMillisConfigEntry: NumberConfigEntry;
    public maxQueuedAsrCountConfigEntry: NumberConfigEntry;
    public tokenConfigEntry: StringConfigEntry;
    public voiceCommandsEnabledConfigEntry: BooleanGuildConfigEntry;
    public client: VoiceBackendClient;
    public voiceCommands: VoiceCommands;
    public phoneticCache: PhoneticCache;
    public speechCache: SpeechCache;

    private voiceStateUpdateHandler: ((oldState: VoiceState, newState: VoiceState) => void) | undefined;

    constructor(bot: Bot) {
        super(bot, "extcord", "voice_commands");

        this.listeners = new Map();

        bot.on("ready", () => this.onReady());
        bot.on("joinVoice", (guild, options) => {
            options.selfDeaf = false;
        });

        this.keywordPhrase = new SimplePhrase({
            name: "keyword",
        }, "bot");
        this.registerPhrase(this.keywordPhrase);

        this.backendLanguageIdPhrase = new SimplePhrase({
            name: "backendLanguageId",
        }, "");
        this.registerPhrase(this.backendLanguageIdPhrase);

        this.urlConfigEntry = new StringConfigEntry({
            name: "url",
        });
        this.registerConfigEntry(this.urlConfigEntry);

        this.similarityThresholdConfigEntry = new NumberConfigEntry({
            name: "confidenceThreshold",
        }, 0.80);
        this.registerConfigEntry(this.similarityThresholdConfigEntry);

        this.minCommandCharactersConfigEntry = new NumberConfigEntry({
            name: "minCommandCharacters",
        }, 3);
        this.registerConfigEntry(this.minCommandCharactersConfigEntry);

        this.minCommandMillisConfigEntry = new NumberConfigEntry({
            name: "minCommandMillis",
        }, 200);
        this.registerConfigEntry(this.minCommandMillisConfigEntry);

        this.maxCommandMillisConfigEntry = new NumberConfigEntry({
            name: "maxCommandMillis",
        }, 10000);
        this.registerConfigEntry(this.maxCommandMillisConfigEntry);

        this.inactivityAfterCommandMillisConfigEntry = new NumberConfigEntry({
            name: "inactivityAfterCommandMillis",
        }, 500);
        this.registerConfigEntry(this.inactivityAfterCommandMillisConfigEntry);

        this.maxQueuedAsrCountConfigEntry = new NumberConfigEntry({
            name: "maxQueuedAsrCount",
        }, 1);
        this.registerConfigEntry(this.maxQueuedAsrCountConfigEntry);

        this.tokenConfigEntry = new StringConfigEntry({
            name: "token",
        });
        this.registerConfigEntry(this.tokenConfigEntry);

        this.voiceCommandsEnabledConfigEntry = new BooleanGuildConfigEntry({
            name: "voiceCommandsEnabled",
        }, bot.database, true);
        this.registerConfigEntry(this.voiceCommandsEnabledConfigEntry);


        bot.intents.push(GatewayIntentBits.GuildVoiceStates);

        this.client = new VoiceBackendClient(this);
        this.voiceCommands = new VoiceCommands(this, bot);
        this.phoneticCache = new PhoneticCache(this, bot);
        this.speechCache = new SpeechCache(this, bot);
    }

    public async getListener(guild: Guild): Promise<GuildListener | undefined> {
        if (this.listeners.has(guild.id)) {
            return this.listeners.get(guild.id)!;
        }

        this.bot.database.ensureConnection();
        const guildEntity = await this.bot.database.repos?.guild.getEntity(guild);

        const extendedGuild = {
            entity: guildEntity,
            guild: guild,
        };

        const enabled = await this.voiceCommandsEnabledConfigEntry.guildGet(extendedGuild);

        if (!enabled) {
            return undefined;
        }

        const language = await this.bot.languages.getLanguage(extendedGuild);

        const backendLanguage = this.backendLanguageIdPhrase.get(language);

        if (backendLanguage === undefined || backendLanguage === "") {
            return undefined;
        }

        const listener = new GuildListener(this, this.bot, guild, language, this.maxQueuedAsrCountConfigEntry.get());

        this.listeners.set(guild.id, listener);
        return listener;
    }

    private async onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
        if (oldState.id !== this.bot.client!.user!.id || newState.id !== this.bot.client!.user!.id) {
            return;
        }
    
        if (oldState.channel === null && newState.channel !== null && !newState.member.user.bot) {
            // joined a channel
            const nonBotUsers = newState.channel.members.filter(member => !member.user.bot);
            if (nonBotUsers.size > 0) {
                setTimeout(async () => {
                    const nonBotUsers = newState.channel.members.filter(member => !member.user.bot);
                    if (nonBotUsers.size > 0) {
                        const listener = await this.getListener(newState.guild);
                        const connection = await this.getConnection(this.bot, newState.channel);
        
                        if (connection !== undefined && listener !== undefined) {
                            newState.selfDeaf = false;
                            connection.join();
                        }
                    }
                }, 5000);
            }
        }
    }
    
    private async getConnection(bot: Bot, voiceChannel: VoiceChannel): Promise<VoiceConnection> {
        return bot.voice.getOrCreateConnection(voiceChannel);
    }

    private onReady() {
        if (this.voiceStateUpdateHandler !== undefined) {
            this.bot.client!.removeListener("voiceStateUpdate", this.voiceStateUpdateHandler);
        }
        this.voiceStateUpdateHandler =
            (oldState: VoiceState, newState: VoiceState) => this.onVoiceStateUpdate(oldState, newState)
                .catch(err => Logger.error(`Error handling voice state update: ${err}`));
        this.bot.client!.on("voiceStateUpdate", this.voiceStateUpdateHandler);
    }
}
