import Discord from "discord.js";
import { Repository } from "typeorm";

import Database from "../database/database";
import MemberPermissionEntity from "./database/memberpermissionentity";

export default class Permission {
    public name: string;
    private database: Database;
    private repo?: Repository<MemberPermissionEntity>;

    constructor(info: IPermissionInfo, database: Database) {
        this.database = database;
        this.name = info.name;
    }

    public async check(member: Discord.GuildMember) { return; }

    private async ensureRepo() {
        if (this.repo) { return; }
        this.repo = await this.database.connection!.getRepository(MemberPermissionEntity);
    }

    private async getEntity(member: Discord.GuildMember) {
        await this.ensureRepo();
        let entity = await this.repo!.findOne({ where: {
            memberId: member.id,
            name: this.name,
        }});
        if (!entity) {
            const memberEntity = await this.database.repos.member!.getEntity(member);
            entity = await this.repo!.create({
                member: memberEntity,
                name: this.name,
            });
        }
        return entity;
    }
}

export interface IPermissionInfo {
    name: string;
}
