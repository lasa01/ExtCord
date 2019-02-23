import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";

import { MemberEntity } from "./memberentity";

@Entity("users")
export class UserEntity {
    @PrimaryColumn()
    public id!: string;

    @Column()
    public username!: string;

    @Column()
    public discriminator!: string;

    @OneToMany((type) => MemberEntity, (member) => member.user)
    public members!: MemberEntity[];
}
