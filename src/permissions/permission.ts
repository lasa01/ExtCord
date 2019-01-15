import Discord from "discord.js";
import { Repository } from "typeorm";

import BooleanConfigEntry from "../config/entry/booleanentry";
import MemberPermissionEntity from "./database/memberpermissionentity";
import RolePermissionEntity from "./database/rolepermissionentity";
import Permissions from "./permissions";

export default class Permission {
    public name: string;
    private permissions: Permissions;
    private memberRepo?: Repository<MemberPermissionEntity>;
    private roleRepo?: Repository<RolePermissionEntity>;
    private defaultEntry: BooleanConfigEntry;

    constructor(info: IPermissionInfo, permissions: Permissions) {
        this.permissions = permissions;
        this.name = info.name;
        this.defaultEntry = permissions.registerDefaultEntry(this.name, info.defaultPermission);
    }

    public async check(member: Discord.GuildMember) {
        this.ensureRepo();
        let result = await this.checkMember(member);
        if (result !== undefined) {
            return result;
        }
        result = await this.checkRoles(member);
        if (result !== undefined) {
            return result;
        }
        return this.getDefault();
    }

    private async checkMember(member: Discord.GuildMember): Promise<boolean|undefined> {
        const memberEntity = await this.permissions.database.repos.member!.getEntity(member);
        const permission = await this.memberRepo!.findOne({
            member: memberEntity,
            name: this.name,
        });
        if (permission) {
            return permission.permission;
        }
    }

    private async checkRoles(member: Discord.GuildMember): Promise<boolean|undefined> {
        const memberEntity = await this.permissions.database.repos.member!.getEntity(member);
        // Roles sorted by position, TODO optimize speed
        for (const role of Array.from(member.roles.values()).sort(Discord.Role.comparePositions)) {
            const roleEntity = await this.roleRepo!.findOne({where: {
                guildId: role.guild.id,
                roleId: role.id,
            }});
            if (roleEntity) {
                return roleEntity.permission;
            }
        }
    }

    private getDefault() {
        return this.defaultEntry.get();
    }

    private ensureRepo() {
        if (this.memberRepo && this.roleRepo) { return; }
        this.memberRepo = this.permissions.database.connection!.getRepository(MemberPermissionEntity);
        this.roleRepo = this.permissions.database.connection!.getRepository(RolePermissionEntity);
    }
}

export interface IPermissionInfo {
    name: string;
    defaultPermission: boolean;
}
