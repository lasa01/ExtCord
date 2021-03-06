import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { GuildEntity } from "../../database/entity/GuildEntity";

/**
 * Database entity for guild's custom aliases.
 * @category Command
 */
@Entity("guildAliases")
export class GuildAliasEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public alias!: string;

    @Column()
    public command!: string;

    @ManyToOne((type) => GuildEntity)
    public guild!: GuildEntity;
}
