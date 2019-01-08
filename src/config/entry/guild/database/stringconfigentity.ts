import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import GuildEntity from "../../../../database/entity/guildentity";

@Entity("stringGuildConfigs")
export default class StringConfigEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column()
    public value!: string;

    @ManyToOne((type) => GuildEntity)
    public guild!: GuildEntity;
}
