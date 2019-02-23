import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { GuildEntity } from "../../../../database/entity/guildentity";

@Entity("booleanGuildConfigs")
export class BooleanConfigEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column()
    public value!: boolean;

    @ManyToOne((type) => GuildEntity)
    public guild!: GuildEntity;
}
