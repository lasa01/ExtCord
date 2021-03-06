import { User } from "discord.js";
import { EntityRepository, Repository } from "typeorm";

import { UserEntity } from "../entity/UserEntity";

/**
 * Database repository for users.
 * @category Database
 */
@EntityRepository(UserEntity)
export class UserRepository extends Repository<UserEntity> {
    private cache: Map<User, UserEntity>;

    constructor() {
        super();
        this.cache = new Map();
    }

    /**
     * Gets the associated user database entity for the specified user.
     * @param user The user to use.
     */
    public async getEntity(user: User): Promise<UserEntity> {
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
    }
}
