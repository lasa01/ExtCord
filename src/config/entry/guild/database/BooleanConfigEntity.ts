import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { GuildEntity } from "../../../../database/entity/GuildEntity";

/**
 * Database entity for guild-specific boolean config entries.
 * @category Config
 */
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
