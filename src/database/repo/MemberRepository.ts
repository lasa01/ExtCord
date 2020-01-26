import { GuildMember } from "discord.js";
import { EntityRepository, Repository } from "typeorm";

import { MemberEntity } from "../entity/MemberEntity";
import { GuildRepository } from "./GuildRepository";
import { UserRepository } from "./UserRepository";

/**
 * Database repository for members.
 * @category Database
 */
@EntityRepository(MemberEntity)
export class MemberRepository extends Repository<MemberEntity> {
    private cache: Map<GuildMember, MemberEntity>;

    constructor() {
        super();
        this.cache = new Map();
    }

    /**
     * Gets the associated member database entity for the specified member.
     * @param member The member to use.
     */
    public async getEntity(member: GuildMember): Promise<MemberEntity> {
        if (this.cache.has(member)) {
            return this.cache.get(member)!;
        }
        let entity = await this.findOne(
            { guildId: member.guild.id, userId: member.user.id },
            { relations: ["guild", "user"] },
        );
        if (!entity) {
            const guild = await this.manager.getCustomRepository(GuildRepository).getEntity(member.guild);
            const user = await this.manager.getCustomRepository(UserRepository).getEntity(member.user);
            entity = this.create({
                guild,
                nickname: member.displayName,
                user,
            });
            await this.save(entity);
        }
        this.cache.set(member, entity);
        return entity;
    }
}
