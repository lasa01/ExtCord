import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { GuildEntity } from "../../database/entity/GuildEntity";
import { CustomPrivilegeIncludeEntity } from "./CustomPrivilegeIncludeEntity";
import { CustomPrivilegePermissionEntity } from "./CustomPrivilegePermissionEntity";

/**
 * Database entity for guild's custom privileges.
 * @category Permission
 */
@Entity("customPrivileges")
export class CustomPrivilegeEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column()
    public description!: string;

    @ManyToOne((type) => GuildEntity)
    public guild!: GuildEntity;

    @OneToMany((type) => CustomPrivilegeIncludeEntity, (include) => include.privilege)
    public includes!: CustomPrivilegeIncludeEntity[];

    @OneToMany((type) => CustomPrivilegePermissionEntity, (permission) => permission.privilege)
    public permissions!: CustomPrivilegePermissionEntity[];
}
