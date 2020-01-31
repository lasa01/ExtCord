import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { RoleEntity } from "../../database/entity/RoleEntity";

/**
 * Database entity for guild role's privileges.
 * @category Permission
 */
@Entity("rolePrivileges")
export class RolePrivilegeEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @ManyToOne((type) => RoleEntity)
    public role!: RoleEntity;
}
