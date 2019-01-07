import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import GuildDatabaseEntity from "./guildentity";

@Entity("stringGuildConfigs")
export default class StringGuildConfigDatabaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column()
    public value!: string;

    @ManyToOne((type) => GuildDatabaseEntity, (guild) => guild.members)
    public guild!: GuildDatabaseEntity;
}
