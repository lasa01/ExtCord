import Discord from "discord.js";
import { EntityRepository, Repository } from "typeorm";

import UserEntity from "../entity/userentity";

@EntityRepository(UserEntity)
export default class UserRepository extends Repository<UserEntity> {
    public async getEntity(user: Discord.User) {
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
