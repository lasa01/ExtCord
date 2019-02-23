import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";

import { MemberEntity } from "./memberentity";
import { RoleEntity } from "./roleentity";

@Entity("guilds")
export class GuildEntity {
    @PrimaryColumn()
    public id!: string;

    @Column()
    public name!: string;

    @OneToMany((type) => MemberEntity, (member) => member.guild)
    public members!: MemberEntity[];

    @OneToMany((type) => RoleEntity, (role) => role.guild)
    public roles!: RoleEntity[];
}
