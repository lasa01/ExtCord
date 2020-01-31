import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { RoleEntity } from "../../database/entity/RoleEntity";

/**
 * Database entity for guild role's permissions.
 * @category Permission
 */
@Entity("rolePermissions")
export class RolePermissionEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column()
    public permission!: boolean;

    @ManyToOne((type) => RoleEntity)
    public role!: RoleEntity;
}
