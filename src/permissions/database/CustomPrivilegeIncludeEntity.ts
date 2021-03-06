import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CustomPrivilegeEntity } from "./CustomPrivilegeEntity";

/**
 * Database entity for guild's custom privilege's included privileges.
 * @category Permission
 */
@Entity("customPrivilegeIncludes")
export class CustomPrivilegeIncludeEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @ManyToOne((type) => CustomPrivilegeEntity, (privilege) => privilege.includes)
    public privilege!: CustomPrivilegeEntity;
}
