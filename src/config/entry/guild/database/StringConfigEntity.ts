import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { GuildEntity } from "../../../../database/entity/GuildEntity";

/**
 * Database entity for guild-specific string config entries.
 * @category Config
 */
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
