import Discord from "discord.js";
import { EntityRepository, Repository } from "typeorm";

import GuildEntity from "../entity/guildentity";

@EntityRepository(GuildEntity)
export default class GuildRepository extends Repository<GuildEntity> {
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
