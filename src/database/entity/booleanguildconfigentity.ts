import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import GuildDatabaseEntity from "./guildentity";

@Entity("booleanGuildConfigs")
export default class BooleanGuildConfigDatabaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column()
    public value!: boolean;

    @ManyToOne((type) => GuildDatabaseEntity, (guild) => guild.members)
    public guild!: GuildDatabaseEntity;
}
