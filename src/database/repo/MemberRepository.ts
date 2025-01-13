import { GuildMember } from "discord.js";
import { EntityRepository, Repository } from "typeorm";

import { MemberEntity } from "../entity/MemberEntity";
import { extendGuildRepository, GuildRepository } from "./GuildRepository";
import { extendUserRepository, UserRepository } from "./UserRepository";
import { GuildEntity } from "../entity/GuildEntity";
import { UserEntity } from "../entity/UserEntity";

/**
 * Database repository for members.
 * @category Database
 */
export interface MemberRepository {
    cache: Map<GuildMember, MemberEntity>;

    /**
     * Gets the associated member database entity for the specified member.
     * @param member The member to use.
     */
    getEntity(member: GuildMember): Promise<MemberEntity>;
}

export function extendMemberRepository(repository: Repository<MemberEntity>): MemberRepository & Repository<MemberEntity> {
    return repository.extend({
        cache: new Map(),

        async getEntity(member) {
            if (this.cache.has(member)) {
                return this.cache.get(member)!;
            }
            let entity = await this.findOne(
                {
                    where: { guildId: member.guild.id, userId: member.user.id },
                    relations: {
                        guild: true,
                        user: true,
                    },
                }
            );
            if (!entity) {
                const guild = await extendGuildRepository(this.manager.getRepository(GuildEntity)).getEntity(member.guild);
                const user = await extendUserRepository(this.manager.getRepository(UserEntity)).getEntity(member.user);
                entity = this.create({
                    guild,
                    nickname: member.displayName,
                    user,
                });
                await this.save(entity);
            }
            this.cache.set(member, entity);
            return entity;
        },
    });
}
