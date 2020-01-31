import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MemberEntity } from "../../database/entity/MemberEntity";

/**
 * Database entity for guild member's permissions.
 * @category Permission
 */
@Entity("memberPermissions")
export class MemberPermissionEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column()
    public permission!: boolean;

    @ManyToOne((type) => MemberEntity)
    public member!: MemberEntity;
}
