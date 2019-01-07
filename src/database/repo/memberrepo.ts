import Discord from "discord.js";
import { EntityRepository, Repository } from "typeorm";

import MemberDatabaseEntity from "../entity/memberentity";
import GuildDatabaseRepository from "./guildrepo";
import UserDatabaseRepository from "./userrepo";

@EntityRepository(MemberDatabaseEntity)
export default class MemberDatabaseRepository extends Repository<MemberDatabaseEntity> {
    public async getEntity(member: Discord.GuildMember) {
        let entity = await this.findOne({ where: { guildId: member.guild.id, userId: member.user.id} });
        if (!entity) {
            const guild = await this.manager.getCustomRepository(GuildDatabaseRepository).getEntity(member.guild);
            const user = await this.manager.getCustomRepository(UserDatabaseRepository).getEntity(member.user);
            entity = await this.create({
                guild,
                nickname: member.nickname,
                user,
            });
        }
        return entity;
    }
}
