import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { GuildEntity } from "./GuildEntity";
import { UserEntity } from "./UserEntity";

/**
 * Database entity for members.
 * @category Database
 */
@Entity("members")
export class MemberEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public nickname!: string;

    @Column()
    public userId!: string;

    @ManyToOne((type) => UserEntity, (user) => user.members)
    public user!: UserEntity;

    @Column()
    public guildId!: string;

    @ManyToOne((type) => GuildEntity, (guild) => guild.members)
    public guild!: GuildEntity;
}
