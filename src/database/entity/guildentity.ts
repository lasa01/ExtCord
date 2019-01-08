import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";

import MemberEntity from "./memberentity";

@Entity("guilds")
export default class GuildEntity {
    @PrimaryColumn()
    public id!: string;

    @Column()
    public name!: string;

    @OneToMany((type) => MemberEntity, (member) => member.guild)
    public members!: MemberEntity[];
}
