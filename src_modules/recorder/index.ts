// extcord module
// requires ffmpeg-static@^5.1.0

import { GatewayIntentBits, Guild, VoiceState } from "discord.js";

import { Bot, CommandGroup, Module } from "../..";

import { JoinCommand } from "./commands/JoinCommand";
import { ClipCommand } from "./commands/ClipCommand";
import { phrases } from "./phrases";
import { GuildRecorder } from "./GuildRecorder";
import { Processor } from "./processor/Processor";

export default class RecorderModule extends Module {
    public voiceCommand: CommandGroup;
    public processor: Processor;

    private recorders: Map<string, GuildRecorder>;

    private voiceStateUpdateHandler: ((oldState: VoiceState, newState: VoiceState) => void) | undefined;

    constructor(bot: Bot) {
        super(bot, "extcord", "recorder");

        this.voiceCommand = new CommandGroup(
            {
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Record voices",
                name: "voice",
            }
        );

        this.voiceCommand.addSubcommands(
            new JoinCommand(),
            new ClipCommand(this),
        );

        this.voiceCommand.addPhrases(...phrases);
        this.registerCommand(this.voiceCommand);

        this.recorders = new Map();
        this.processor = new Processor();

        bot.on("ready", () => this.onReady());
        bot.on("stop", () => this.onStop());
        bot.on("joinVoice", (guild, options) => {
            options.selfDeaf = false;
        });

        bot.intents.push(GatewayIntentBits.GuildVoiceStates);
    }

    public getRecorder(guild: Guild): GuildRecorder {
        if (this.recorders.has(guild.id)) {
            return this.recorders.get(guild.id)!;
        }

        const recorder = new GuildRecorder(guild, this);

        this.recorders.set(guild.id, recorder);
        return recorder;
    }

    private onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
        if (oldState.id !== this.bot.client!.user!.id || newState.id !== this.bot.client!.user!.id) {
            return;
        }

        if (oldState.channel === null && newState.channel !== null) {
            // joined a channel
            const recorder = this.getRecorder(newState.guild);
            const connection = this.bot.voice.getConnection(newState.guild);

            if (connection !== undefined) {
                newState.selfDeaf = false;
                recorder.startRecording(connection);
            }
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
        this.processor.close();
    }
}
