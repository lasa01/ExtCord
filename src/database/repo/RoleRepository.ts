import { Role } from "discord.js";
import { EntityRepository, Repository } from "typeorm";

import { RoleEntity } from "../entity/RoleEntity";
import { GuildRepository } from "./GuildRepository";

@EntityRepository(RoleEntity)
export class RoleRepository extends Repository<RoleEntity> {
    private cache: Map<Role, RoleEntity>;

    constructor() {
        super();
        this.cache = new Map();
    }

    public async getEntity(role: Role): Promise<RoleEntity> {
        if (this.cache.has(role)) {
            return this.cache.get(role)!;
        }
        let entity = await this.findOne({ guildId: role.guild.id, roleId: role.id }, { relations: ["guild"] });
        if (!entity) {
            const guild = await this.manager.getCustomRepository(GuildRepository).getEntity(role.guild);
            entity = this.create({
                guild,
                name: role.name,
                roleId: role.id,
            });
            await this.save(entity);
        }
        this.cache.set(role, entity);
        return entity;
    }
}
