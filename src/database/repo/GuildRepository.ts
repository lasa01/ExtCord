import { Guild } from "discord.js";
import { Repository } from "typeorm";

import { GuildEntity } from "../entity/GuildEntity";

/**
 * Database repository for guilds.
 * @category Database
 */
export interface GuildRepository {
    cache: Map<Guild, GuildEntity>;

    /**
     * Gets the associated guild database entity for the specified guild.
     * @param guild The guild to use.
     */
    getEntity(guild: Guild): Promise<GuildEntity>;
}

export function extendGuildRepository(repository: Repository<GuildEntity>): GuildRepository & Repository<GuildEntity> {
    return repository.extend({
        cache: new Map(),

        async getEntity(guild) {
            if (this.cache.has(guild)) {
                return this.cache.get(guild)!;
            }
            const structure = {
                id: guild.id,
                name: guild.name,
            };
            let entity = await this.preload(structure);
            if (!entity) {
                entity = this.create(structure);
                await this.save(entity);
            }
            this.cache.set(guild, entity);
            return entity;
        },
    })
}
