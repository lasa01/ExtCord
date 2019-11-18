import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MemberEntity } from "../../database/entity/MemberEntity";

@Entity("memberPrivileges")
export class MemberPrivilegeEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @ManyToOne((type) => MemberEntity)
    public member!: MemberEntity;
}
