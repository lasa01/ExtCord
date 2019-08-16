import { User } from "discord.js";
import { EntityRepository, Repository } from "typeorm";

import { UserEntity } from "../entity/UserEntity";

@EntityRepository(UserEntity)
export class UserRepository extends Repository<UserEntity> {
    public async getEntity(user: User) {
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
        return entity;
    }
}
