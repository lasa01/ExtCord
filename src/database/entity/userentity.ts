import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";

import MemberDatabaseEntity from "./memberentity";

@Entity("users")
export default class UserDatabaseEntity {
    @PrimaryColumn()
    public id!: string;

    @Column()
    public username!: string;

    @Column()
    public discriminator!: string;

    @OneToMany((type) => MemberDatabaseEntity, (member) => member.user)
    public members!: MemberDatabaseEntity[];
}
