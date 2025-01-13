import { User } from "discord.js";
import { EntityRepository, Repository } from "typeorm";

import { UserEntity } from "../entity/UserEntity";

/**
 * Database repository for users.
 * @category Database
 */
export interface UserRepository {
    cache: Map<User, UserEntity>;

    /**
     * Gets the associated user database entity for the specified user.
     * @param user The user to use.
     */
    getEntity(user: User): Promise<UserEntity>;
}

export function extendUserRepository(repository: Repository<UserEntity>): UserRepository & Repository<UserEntity> {
    return repository.extend({
        cache: new Map(),

        async getEntity(user) {
            if (this.cache.has(user)) {
                return this.cache.get(user)!;
            }
            const structure = {
                discriminator: user.discriminator,
                id: user.id,
                username: user.username,
            };
            let entity = await this.preload(structure);
            if (!entity) {
                entity = await this.create(structure);
                await this.save(entity);
            }
            this.cache.set(user, entity);
            return entity;
        },
    });
}
