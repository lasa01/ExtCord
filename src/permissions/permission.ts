import Discord from "discord.js";
import { Repository } from "typeorm";
import Winston from "winston";

import BooleanConfigEntry from "../config/entry/booleanentry";
import MemberPermissionEntity from "./database/memberpermissionentity";
import RolePermissionEntity from "./database/rolepermissionentity";
import Permissions from "./permissions";

export default class Permission {
    public name: string;
    private logger: Winston.Logger;
    private permissions: Permissions;
    private memberRepo?: Repository<MemberPermissionEntity>;
    private roleRepo?: Repository<RolePermissionEntity>;
    private defaultEntry: BooleanConfigEntry;

    constructor(info: IPermissionInfo, permissions: Permissions) {
        this.permissions = permissions;
        this.name = info.name;
        this.defaultEntry = permissions.registerDefaultEntry(this.name, info.defaultPermission);
        this.logger = permissions.logger;
    }

    public async check(member: Discord.GuildMember) {
        this.logger.debug(`Checking for permission ${this.name} for member ${member.id}`);
        this.ensureRepo();
        let result = await this.checkMember(member);
        if (result !== undefined) {
            this.logger.debug(`Found member-specific entry for permission ${this.name} for member ${member.id}`);
            return result;
        }
        result = await this.checkRoles(member);
        if (result !== undefined) {
            this.logger.debug(`Found role-specific entry for permission ${this.name} for member ${member.id}`);
            return result;
        }
        this.logger.debug(`Returning default for permission ${this.name} for role ${member.id}`);
        return this.getDefault();
    }

    public async checkRole(role: Discord.Role) {
        this.logger.debug(`Checking for permission ${this.name} for role ${role.id}`);
        this.ensureRepo();
        const result = await this.checkRolePart(role);
        if (result !== undefined) {
            this.logger.debug(`Found role-specific entry for permission ${this.name} for role ${role.id}`);
            return result;
        }
        this.logger.debug(`Returning default for permission ${this.name} for role ${role.id}`);
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
        // Roles sorted by position, TODO optimize speed
        for (const role of Array.from(member.roles.values()).sort(Discord.Role.comparePositions)) {
            const permission = await this.checkRolePart(role);
            if (permission !== null) { return permission; }
        }
    }

    private async checkRolePart(role: Discord.Role) {
        const roleEntity = await this.roleRepo!.findOne({where: {
            guildId: role.guild.id,
            roleId: role.id,
        }});
        if (roleEntity) {
            return roleEntity.permission;
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
