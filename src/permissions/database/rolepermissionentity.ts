import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import RoleEntity from "../../database/entity/roleentity";

@Entity("rolePermissions")
export default class RolePermissionEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column()
    public permission!: boolean;

    @ManyToOne((type) => RoleEntity)
    public member!: RoleEntity;
}
