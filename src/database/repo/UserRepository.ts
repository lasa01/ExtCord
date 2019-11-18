import { User } from "discord.js";
import { EntityRepository, Repository } from "typeorm";

import { UserEntity } from "../entity/UserEntity";

@EntityRepository(UserEntity)
export class UserRepository extends Repository<UserEntity> {
    private cache: Map<User, UserEntity>;

    constructor() {
        super();
        this.cache = new Map();
    }

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
