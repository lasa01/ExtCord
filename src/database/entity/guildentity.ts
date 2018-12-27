import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";

import MemberDatabaseEntity from "./memberentity";

@Entity("guilds")
export default class GuildDatabaseEntity {
    @PrimaryColumn()
    public id!: string;

    @Column()
    public name!: string;

    @OneToMany((type) => MemberDatabaseEntity, (member) => member.guild)
    public members!: MemberDatabaseEntity[];
}
