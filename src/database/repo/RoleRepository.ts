import { Role } from "discord.js";
import { EntityRepository, Repository } from "typeorm";

import { RoleEntity } from "../entity/RoleEntity";
import { extendGuildRepository, GuildRepository } from "./GuildRepository";
import { GuildEntity } from "../entity/GuildEntity";

/**
 * Database repository for roles.
 * @category Database
 */
export interface RoleRepository {
    cache: Map<Role, RoleEntity>;

    /**
     * Gets the associated role database entity for the specified role.
     * @param role The role to use.
     */
    getEntity(role: Role): Promise<RoleEntity>;
}

export function extendRoleRepository(repository: Repository<RoleEntity>): RoleRepository & Repository<RoleEntity> {
    return repository.extend({
        cache: new Map(),

        async getEntity(role) {
            if (this.cache.has(role)) {
                return this.cache.get(role)!;
            }
            let entity = await this.findOne({
                where: { guildId: role.guild.id, roleId: role.id }, relations: {
                    guild: true,
                }
            });
            if (!entity) {
                const guild = await extendGuildRepository(this.manager.getRepository(GuildEntity)).getEntity(role.guild);
                entity = this.create({
                    guild,
                    name: role.name,
                    roleId: role.id,
                });
                await this.save(entity);
            }
            this.cache.set(role, entity);
            return entity;
        },
    });
}
