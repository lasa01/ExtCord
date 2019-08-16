import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { GuildEntity } from "./GuildEntity";
import { UserEntity } from "./UserEntity";

@Entity("members")
export class MemberEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public nickname!: string;

    @ManyToOne((type) => UserEntity, (user) => user.members)
    public user!: UserEntity;

    @ManyToOne((type) => GuildEntity, (guild) => guild.members)
    public guild!: GuildEntity;
}
