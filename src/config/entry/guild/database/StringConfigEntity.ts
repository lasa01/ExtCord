import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { GuildEntity } from "../../../../database/entity/GuildEntity";

@Entity("stringGuildConfigs")
export class StringConfigEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column()
    public value!: string;

    @ManyToOne((type) => GuildEntity)
    public guild!: GuildEntity;
}
