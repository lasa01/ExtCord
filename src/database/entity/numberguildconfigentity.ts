import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import GuildDatabaseEntity from "./guildentity";

@Entity("numberGuildConfigs")
export default class NumberGuildConfigDatabaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column()
    public value!: number;

    @ManyToOne((type) => GuildDatabaseEntity, (guild) => guild.members)
    public guild!: GuildDatabaseEntity;
}
