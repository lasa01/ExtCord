import { Repository } from "typeorm";
import { LRUCache } from "lru-cache";

import { Bot } from "../..";
import VoiceCommandsModule from ".";
import { SpeechCacheEntryEntity } from "./database/SpeechCacheEntryEntity";
import { AudioResource, StreamType, createAudioResource } from "@discordjs/voice";
import { Readable } from "stream";

export class SpeechCache {
    private module: VoiceCommandsModule;
    private bot: Bot;
    private repo?: Repository<SpeechCacheEntryEntity>;
    private cache: LRUCache<string, Buffer>;

    constructor(module: VoiceCommandsModule, bot: Bot) {
        this.module = module;
        this.bot = bot;

        bot.database.registerEntity(SpeechCacheEntryEntity);
        this.cache = new LRUCache({
            max: 64,
        });
    }

    public async getSpeech(text: string, language: string, cached: boolean): Promise<Buffer | undefined> {
        text = this.cleanText(text);
        const fullCleanText = this.fullCleanText(text);

        if (fullCleanText.length === 0) {
            return undefined;
        }

        const cacheKey = `${language}/${text}`;

        const cacheResult = this.cache.get(cacheKey);
        if (cacheResult !== undefined) {
            return cacheResult;
        }

        if (!cached) {
            const oggArrayBuffer = await this.module.client.fetchSpeech(text, language);
            const buffer = Buffer.from(new Uint8Array(oggArrayBuffer));

            this.cache.set(cacheKey, buffer);
            return buffer;
        }

        const cacheEntry = {
            language,
            text,
        };

        const repo = this.getRepo();

        let cacheEntity = await repo.preload(cacheEntry);
        let ogg: Buffer;

        if (cacheEntity === undefined) {
            const oggArrayBuffer = await this.module.client.fetchSpeech(text, language);
            ogg = Buffer.from(new Uint8Array(oggArrayBuffer));

            cacheEntity = repo.create({ ...cacheEntry, ogg });
            await repo.save(cacheEntity);
        } else {
            ogg = cacheEntity.ogg;
        }

        this.cache.set(cacheKey, ogg);
        return ogg;
    }

    public async getSpeechResource(text: string, language: string, cached: boolean): Promise<AudioResource<string> | undefined> {
        const buffer = await this.getSpeech(text, language, cached);

        if (buffer === undefined) {
            return undefined;
        }

        const resourceStream = new Readable({
            read() {
                this.push(buffer);
                this.push(null);
            }
        });

        return createAudioResource(resourceStream, {
            inputType: StreamType.OggOpus,
            metadata: text,
        });
    }

    private cleanText(text: string): string {
        return text.replace(/[^\p{L}\d\s.,]/gu, "");
    }

    private fullCleanText(text: string): string {
        return text.replace(/[^\p{L}\d\s]/gu, "");
    }

    private getRepo(): Repository<SpeechCacheEntryEntity> {
        if (!this.repo) {
            this.bot.database.ensureConnection();
            this.repo = this.bot.database.connection.getRepository(SpeechCacheEntryEntity);
        }

        return this.repo;
    }
}