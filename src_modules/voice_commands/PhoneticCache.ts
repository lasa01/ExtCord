import { Repository } from "typeorm";
import { PhoneticCacheEntryEntity } from "./database/PhoneticCacheEntryEntity";

import { Bot } from "../..";
import VoiceCommandsModule from ".";

export class PhoneticCache {
    private module: VoiceCommandsModule;
    private bot: Bot;
    private repo?: Repository<PhoneticCacheEntryEntity>;
    private cache: Map<string, Map<string, string>>;

    constructor(module: VoiceCommandsModule, bot: Bot) {
        this.module = module;
        this.bot = bot;
        this.cache = new Map();

        bot.database.registerEntity(PhoneticCacheEntryEntity);
    }

    public async getPhonetic(plain: string, language: string, cached: boolean): Promise<string> {
        if (!cached) {
            return this.module.client.fetchPhonetic(plain, language);
        }

        let languageCache = this.cache.get(language);

        if (languageCache === undefined) {
            languageCache = new Map();
            this.cache.set(language, languageCache);
        }

        let phonetic = languageCache.get(plain);

        if (phonetic !== undefined) {
            return phonetic;
        }

        const cacheEntry = {
            language,
            plain,
        };

        const repo = this.getRepo();

        let cacheEntity = await repo.preload(cacheEntry);

        if (cacheEntity === undefined) {
            phonetic = await this.module.client.fetchPhonetic(plain, language);

            cacheEntity = repo.create({ ...cacheEntry, phonetic });
            await repo.save(cacheEntity);
        } else {
            phonetic = cacheEntity.phonetic;
        }

        languageCache.set(plain, phonetic);
        return phonetic;
    }

    private getRepo(): Repository<PhoneticCacheEntryEntity> {
        if (!this.repo) {
            this.bot.database.ensureConnection();
            this.repo = this.bot.database.connection.getRepository(PhoneticCacheEntryEntity);
        }

        return this.repo;
    }
}