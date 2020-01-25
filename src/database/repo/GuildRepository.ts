import { Guild } from "discord.js";
import { EntityRepository, Repository } from "typeorm";

import { GuildEntity } from "../entity/GuildEntity";

/**
 * Database repository for guilds.
 * @category Database
 */
@EntityRepository(GuildEntity)
export class GuildRepository extends Repository<GuildEntity> {
    private cache: Map<Guild, GuildEntity>;

    constructor() {
        super();
        this.cache = new Map();
    }

    /**
     * Gets the associated guild database entity for the specified guild.
     * @param guild The guild to use.
     */
    public async getEntity(guild: Guild): Promise<GuildEntity> {
        if (this.cache.has(guild)) {
            return this.cache.get(guild)!;
        }
        const structure = {
            id: guild.id,
            name: guild.name,
        };
        let entity = await this.preload(structure);
        if (!entity) {
            entity = await this.create(structure);
            await this.save(entity);
        }
        this.cache.set(guild, entity);
        return entity;
    }
}
