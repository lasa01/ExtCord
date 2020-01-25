import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { GuildEntity } from "./GuildEntity";

/**
 * Database entity for roles.
 * @category Database
 */
@Entity("roles")
export class RoleEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public roleId!: string;

    @Column()
    public name!: string;

    @Column()
    public guildId!: string;

    @ManyToOne((type) => GuildEntity, (guild) => guild.roles)
    public guild!: GuildEntity;
}
