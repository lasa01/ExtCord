import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import GuildDatabaseEntity from "./guildentity";
import UserDatabaseEntity from "./userentity";

@Entity("members")
export default class MemberDatabaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public nickname!: string;

    @ManyToOne((type) => UserDatabaseEntity, (user) => user.members)
    public user!: UserDatabaseEntity;

    @ManyToOne((type) => GuildDatabaseEntity, (guild) => guild.members)
    public guild!: GuildDatabaseEntity;
}
