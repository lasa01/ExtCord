import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";

import BooleanGuildConfigDatabaseEntity from "./booleanguildconfigentity";
import MemberDatabaseEntity from "./memberentity";
import NumberGuildConfigDatabaseEntity from "./numberguildconfigentity";
import StringGuildConfigDatabaseEntity from "./stringguildconfigentity";

@Entity("guilds")
export default class GuildDatabaseEntity {
    @PrimaryColumn()
    public id!: string;

    @Column()
    public name!: string;

    @OneToMany((type) => MemberDatabaseEntity, (member) => member.guild)
    public members!: MemberDatabaseEntity[];

    @OneToMany((type) => BooleanGuildConfigDatabaseEntity, (config) => config.guild)
    public booleanConfigs!: BooleanGuildConfigDatabaseEntity[];

    @OneToMany((type) => NumberGuildConfigDatabaseEntity, (config) => config.guild)
    public numberConfigs!: NumberGuildConfigDatabaseEntity[];

    @OneToMany((type) => StringGuildConfigDatabaseEntity, (config) => config.guild)
    public stringConfigs!: StringGuildConfigDatabaseEntity[];
}
