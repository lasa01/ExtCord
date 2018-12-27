import Discord from "discord.js";
import { EntityRepository, Repository } from "typeorm";

import UserDatabaseEntity from "../entity/userentity";

@EntityRepository(UserDatabaseEntity)
export default class UserDatabaseRepository extends Repository<UserDatabaseEntity> {
    public async getEntity(user: Discord.User) {
        const structure = {
            discriminator: user.discriminator,
            id: user.id,
            username: user.username,
        };
        let entity = await this.preload(structure);
        if (!entity) {
            entity = await this.create(structure);
        }
        return entity;
    }
}
