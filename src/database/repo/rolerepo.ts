import Discord from "discord.js";
import { EntityRepository, Repository } from "typeorm";

import RoleEntity from "../entity/roleentity";
import GuildRepository from "./guildrepo";

@EntityRepository(RoleEntity)
export default class RoleRepository extends Repository<RoleEntity> {
    public async getEntity(role: Discord.Role) {
        let entity = await this.findOne({ where: { guildId: role.guild.id, roleId: role.id } });
        if (!entity) {
            const guild = await this.manager.getCustomRepository(GuildRepository).getEntity(role.guild);
            entity = await this.create({
                guild,
                name: role.name,
                roleId: role.id,
            });
        }
        return entity;
    }
}
