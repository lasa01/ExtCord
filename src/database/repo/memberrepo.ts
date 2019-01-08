import Discord from "discord.js";
import { EntityRepository, Repository } from "typeorm";

import MemberEntity from "../entity/memberentity";
import GuildRepository from "./guildrepo";
import UserRepository from "./userrepo";

@EntityRepository(MemberEntity)
export default class MemberRepository extends Repository<MemberEntity> {
    public async getEntity(member: Discord.GuildMember) {
        let entity = await this.findOne({ where: { guildId: member.guild.id, userId: member.user.id} });
        if (!entity) {
            const guild = await this.manager.getCustomRepository(GuildRepository).getEntity(member.guild);
            const user = await this.manager.getCustomRepository(UserRepository).getEntity(member.user);
            entity = await this.create({
                guild,
                nickname: member.nickname,
                user,
            });
        }
        return entity;
    }
}
