import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import MemberEntity from "../../database/entity/memberentity";

@Entity("memberPermissions")
export default class MemberPermissionEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column()
    public permission!: boolean;

    @ManyToOne((type) => MemberEntity)
    public member!: MemberEntity;
}
