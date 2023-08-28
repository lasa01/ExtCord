import { distance } from "fastest-levenshtein";
import { Guild, GuildMember, PermissionsBitField } from "discord.js";

import { Bot, AnyCommand, CommandGroup, IExtendedGuild, Logger, LinkedResponse, ICommandContext, CommandPhrases } from "../..";

import VoiceCommandsModule from ".";
import { IAsrResult } from "./VoiceBackendClient";
import { GuildVoiceResponder } from "./GuildVoiceResponder";
import { VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";

export class VoiceCommands {
    private module: VoiceCommandsModule;
    private bot: Bot;
    private languagePhoneticCommandsMap: Map<string, Map<string, AnyCommand>>;
    private guildPhoneticCommandsMap: Map<string, Map<string, AnyCommand>>;

    private guildResponders: Map<string, GuildVoiceResponder>;

    constructor(module: VoiceCommandsModule, bot: Bot) {
        this.bot = bot;
        this.module = module;
        this.guildPhoneticCommandsMap = new Map();
        this.languagePhoneticCommandsMap = new Map();
        this.guildResponders = new Map();
    }

    public async processTranscription(member: GuildMember, transcription: IAsrResult, connection: VoiceConnection | undefined) {
        const startTime = process.hrtime();

        Logger.debug(`Voice commands processing transcription: ${transcription.text}`);

        this.bot.database.ensureConnection();

        const memberEntity = await this.bot.database.repos.member.getEntity(member);

        const extendedUser = {
            entity: memberEntity.user,
            user: member.user,
        };

        const extendedGuild = {
            entity: memberEntity.guild,
            guild: member.guild,
        };

        const extendedMember = {
            entity: memberEntity,
            member,
        };

        const language = await this.bot.languages.getLanguage(extendedGuild);

        const startsWithKeywordData = await this.startsWithKeyword(extendedGuild, language, transcription.text, transcription.text_phonetic);

        if (!startsWithKeywordData.startsWithKeyword) {
            return;
        }

        if (startsWithKeywordData.plainCommand.trim().length <= this.module.minCommandCharactersConfigEntry.get()) {
            Logger.debug(`Voice command "${startsWithKeywordData.plainCommand}" is too short, ignoring`);
            return;
        }

        const resolvedCommand = await this.resolveCommand(extendedGuild, language, startsWithKeywordData.plainCommand, startsWithKeywordData.phoneticCommand);

        const responder = this.getOrCreateResponder(member.guild, language);
        const usageNumber = responder.beginUse();

        const respond: LinkedResponse = async (phrase, stuff, fieldStuff, extraOptions) => {
            if (connection === undefined || connection.state.status !== VoiceConnectionStatus.Ready) {
                Logger.debug(`Voice connection is not ready, cannot respond to voice command`);
                return;
            }

            const responder = this.getOrCreateResponder(member.guild, language);
            if (responder.destroyed) {
                Logger.debug(`Could not respond to voice command anymore, queueing player failed`);
                return;
            }

            const usageNumber = responder.beginUse();
            var responseParts = phrase.getParts(language, stuff);

            const newLineIndex = responseParts.findIndex(p => p.text.includes("\n"));
            if (newLineIndex !== -1) {
                const newLinePart = responseParts[newLineIndex];
                const newLinePartWithoutNewLine = newLinePart.text.substring(0, newLinePart.text.indexOf("\n"));

                responseParts = responseParts.splice(0, newLineIndex);
                responseParts.push({
                    text: newLinePartWithoutNewLine,
                    template: newLinePart.template,
                });
            }

            Logger.debug(`Responding to voice command with: ${responseParts.map(p => p.text).join(", ")}`);

            var responsePartAudios = responseParts.map(part => this.module.speechCache.getSpeechResource(part.text, language, !part.template));

            var lastResponsePromise: Promise<void> = Promise.resolve();

            for (const responsePartAudioPromise of responsePartAudios) {
                const responsePartAudio = await responsePartAudioPromise;

                if (responsePartAudio === undefined) {
                    continue;
                }

                lastResponsePromise = responder.queueResponse(responsePartAudio);
            }

            await lastResponsePromise;
            responder.endUse(usageNumber);
        };

        if (resolvedCommand === undefined) {
            await respond(CommandPhrases.invalidCommand, { command: startsWithKeywordData.plainCommand });
            responder.endUse(usageNumber);
            return;
        }

        const context: ICommandContext = {
            bot: this.bot,
            botPermissions: new PermissionsBitField(),
            command: resolvedCommand.plainTrigger,
            guild: extendedGuild,
            language,
            member: extendedMember,
            prefix: this.module.keywordPhrase.get(language),
            respond,
            user: extendedUser,
            voiceCommand: true,
        };

        const timeDiff = process.hrtime(startTime);
        Logger.debug(`Voice command preprocessing took ${((timeDiff[0] * 1e9 + timeDiff[1]) / 1000000).toFixed(3)} ms`);
        Logger.debug(`Executing voice command "${resolvedCommand.plainTrigger}" as ${resolvedCommand.command.fullName}`);
        await resolvedCommand.command.command(context, resolvedCommand.plainArguments);

        responder.endUse(usageNumber);
    }

    public async startsWithKeyword(guild: IExtendedGuild, language: string, plainCommand: string, phoneticCommand: string): Promise<IStartsWithKeyword> {
        const keyword = this.module.keywordPhrase.get(language);
        const phoneticKeyword = await this.module.phoneticCache.getPhonetic(keyword, language, true);

        const similarityData = this.getPrefixSimilarity(plainCommand, phoneticCommand, phoneticKeyword);

        return {
            startsWithKeyword: similarityData.similarity >= this.module.similarityThresholdConfigEntry.get(),
            phoneticCommand: similarityData.restPhonetic,
            plainCommand: similarityData.rest,
        };
    }

    public async resolveCommand(guild: IExtendedGuild, language: string, plainCommand: string, phoneticCommand: string): Promise<IResolvedCommand | undefined> {
        const phoneticCommandsMap = await this.getGuildPhoneticCommandsMap(guild, language);
        const similarityThreshold = this.module.similarityThresholdConfigEntry.get();

        let maxSimilarity = 0.0;
        let bestData: IPrefixSimilarity | undefined = undefined;
        let bestCommand: AnyCommand | undefined = undefined;

        for (const [phoneticTrigger, command] of phoneticCommandsMap) {
            const similarityData = this.getPrefixSimilarity(plainCommand, phoneticCommand, phoneticTrigger);

            if (similarityData.similarity > maxSimilarity) {
                maxSimilarity = similarityData.similarity;
                bestData = similarityData;
                bestCommand = command;
            }
        }

        if (maxSimilarity < similarityThreshold || bestCommand === undefined || bestData === undefined) {
            return;
        }

        Logger.debug(`Voice command "${plainCommand}" was resolved to ${bestCommand.fullName} with similarity ${maxSimilarity}`);

        return {
            command: bestCommand,
            phoneticTrigger: bestData.similarPhonetic,
            plainTrigger: bestData.similar,
            phoneticArguments: bestData.restPhonetic,
            plainArguments: bestData.rest,
        };
    }

    public cleanUp(guild: Guild) {
        const responder = this.guildResponders.get(guild.id);

        if (responder === undefined) {
            return;
        }

        responder.destroy();
        this.guildResponders.delete(guild.id);
    }

    private getPrefixSimilarity(plain: string, phonetic: string, phoneticPrefix: string): IPrefixSimilarity {
        let words = plain.trim().split(" ");
        let wordsPhonetic = phonetic.trim().split(" ");

        let similar = "";
        let similarPhonetic = "";
        let similarFinished = false;

        let rest = "";
        let restPhonetic = "";

        for (const [word, wordPhonetic] of words.map((word, index) => [word, wordsPhonetic[index]])) {
            if (similarFinished) {
                if (rest !== "") {
                    rest += " ";
                    restPhonetic += " ";
                }
                rest += word;
                restPhonetic += wordPhonetic;

                continue;
            }

            if (similarPhonetic.length + wordPhonetic.length > phoneticPrefix.length) {
                const lengthDiff = phoneticPrefix.length - similarPhonetic.length;
                const lengthDiffNext = similarPhonetic.length + wordPhonetic.length - phoneticPrefix.length;

                if (lengthDiffNext <= lengthDiff) {
                    similar += word;
                    similarPhonetic += wordPhonetic;
                } else {
                    rest += word;
                    restPhonetic += wordPhonetic;
                }

                similarFinished = true;
            } else {
                similar += word;
                similarPhonetic += wordPhonetic;
            }
        }

        const prefixDistance = distance(similarPhonetic, phoneticPrefix);
        const similarity = 1.0 - prefixDistance / phoneticPrefix.length;

        return {
            similar,
            similarPhonetic,
            similarity,
            rest,
            restPhonetic,
        };
    }

    private async getGuildPhoneticCommandsMap(guild: IExtendedGuild, language: string) {
        if (this.guildPhoneticCommandsMap.has(`${guild.guild.id}/${language}`)) {
            return this.guildPhoneticCommandsMap.get(`${guild.guild.id}/${language}`)!;
        }
        const map = new Map(await this.getLanguagePhoneticCommmandsMap(language));

        this.guildPhoneticCommandsMap.set(`${guild.guild.id}/${language}`, map);
        return map;
    }

    private async getLanguagePhoneticCommmandsMap(language: string) {
        if (this.languagePhoneticCommandsMap.has(language)) {
            return this.languagePhoneticCommandsMap.get(language)!;
        }

        const map: Map<string, AnyCommand> = new Map();
        const promises: Promise<void>[] = [];

        for (const [, command] of this.bot.commands.getCommands()) {
            const localizedName = command.localizedName.get(language);

            if (this.isValidVoiceCommand(command, localizedName)) {
                promises.push(this.addToPhoneticMap(map, localizedName, command, language));
            }

            for (const [alias, aliasCommand] of Object.entries(command.getAliases(language))) {
                if (!this.isValidVoiceCommand(aliasCommand, alias)) {
                    continue;
                }

                promises.push(this.addToPhoneticMap(map, alias, aliasCommand, language));
            }

            for (const [alias, aliasCommand] of Object.entries(command.getGlobalAliases(language))) {
                if (!this.isValidVoiceCommand(aliasCommand, alias)) {
                    continue;
                }

                promises.push(this.addToPhoneticMap(map, alias, aliasCommand, language));
            }
        }

        await Promise.all(promises);

        this.languagePhoneticCommandsMap.set(language, map);
        return map;
    }

    private isValidVoiceCommand(command: AnyCommand, alias: string): boolean {
        if (!command.voiceCommand) {
            return false;
        }

        if (command instanceof CommandGroup) {
            return false;
        }

        if (alias.length < this.module.minCommandCharactersConfigEntry.get()) {
            return false;
        }

        return true;
    }

    private async addToPhoneticMap(map: Map<string, AnyCommand>, alias: string, command: AnyCommand, language: string) {
        var phoneticAlias = await this.module.phoneticCache.getPhonetic(alias, language, true);

        map.set(phoneticAlias, command);
    }

    private getOrCreateResponder(guild: Guild, language: string): GuildVoiceResponder {
        let responder = this.guildResponders.get(guild.id);

        if (responder === undefined || responder.destroyed) {
            responder = new GuildVoiceResponder(this.module, this.bot, guild, language);
            this.guildResponders.set(guild.id, responder);
        }

        return responder;
    }
}

interface IPrefixSimilarity {
    similarity: number;
    similar: string;
    similarPhonetic: string;
    rest: string;
    restPhonetic: string;
}

interface IResolvedCommand {
    command: AnyCommand;
    plainTrigger: string;
    phoneticTrigger: string;
    plainArguments: string;
    phoneticArguments: string;
}

interface IStartsWithKeyword {
    startsWithKeyword: boolean;
    phoneticCommand: string;
    plainCommand: string;
}
