import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CustomPrivilegeEntity } from "./CustomPrivilegeEntity";

/**
 * Database entity for guild's custom privilege's permissions.
 * @category Permission
 */
@Entity("customPrivilegePermissions")
export class CustomPrivilegePermissionEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column()
    public allow!: boolean;

    @ManyToOne((type) => CustomPrivilegeEntity, (privilege) => privilege.permissions)
    public privilege!: CustomPrivilegeEntity;
}
