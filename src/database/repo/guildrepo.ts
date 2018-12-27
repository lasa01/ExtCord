import Discord from "discord.js";
import { EntityRepository, Repository } from "typeorm";

import GuildDatabaseEntity from "../entity/guildentity";

@EntityRepository(GuildDatabaseEntity)
export default class GuildDatabaseRepository extends Repository<GuildDatabaseEntity> {
    public async getEntity(guild: Discord.Guild) {
        const structure = {
            id: guild.id,
            name: guild.name,
        };
        let entity = await this.preload(structure);
        if (!entity) {
            entity = await this.create(structure);
        }
        return entity;
    }
}
