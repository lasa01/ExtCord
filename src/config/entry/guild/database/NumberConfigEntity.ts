import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { GuildEntity } from "../../../../database/entity/GuildEntity";

/**
 * Database entity for guild-specific number config entries.
 * @category Config
 */
@Entity("numberGuildConfigs")
export class NumberConfigEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column()
    public value!: number;

    @ManyToOne((type) => GuildEntity)
    public guild!: GuildEntity;
}
