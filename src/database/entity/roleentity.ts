import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { GuildEntity } from "./guildentity";

@Entity("roles")
export class RoleEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public roleId!: string;

    @Column()
    public name!: string;

    @ManyToOne((type) => GuildEntity, (guild) => guild.roles)
    public guild!: GuildEntity;
}
