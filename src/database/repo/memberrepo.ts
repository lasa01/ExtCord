import Discord from "discord.js";
import { EntityRepository, Repository } from "typeorm";

import MemberDatabaseEntity from "../entity/memberentity";

@EntityRepository(MemberDatabaseEntity)
export default class MemberDatabaseRepository extends Repository<MemberDatabaseEntity> {
    public async getEntity(member: Discord.GuildMember) {
        let entity = await this.findOne({ where: { guildId: member.guild.id, userId: member.user.id} });
        if (!entity) {
            entity = await this.create({
                nickname: member.nickname,
            });
        }
        return entity;
    }
}
