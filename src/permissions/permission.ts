import { GuildMember, Role } from "discord.js";
import { Repository } from "typeorm";
import { Logger } from "winston";

import { BooleanConfigEntry } from "../config/entry/booleanentry";
import { ConfigEntry } from "../config/entry/entry";
import { MemberPermissionEntity } from "./database/memberpermissionentity";
import { RolePermissionEntity } from "./database/rolepermissionentity";
import { Permissions } from "./permissions";

export class Permission {
    public name: string;
    public fullName: string;
    public description: string;
    private logger?: Logger;
    private permissions?: Permissions;
    private memberRepo?: Repository<MemberPermissionEntity>;
    private roleRepo?: Repository<RolePermissionEntity>;
    private defaultEntry: ConfigEntry;
    private parent?: Permission;

    constructor(info: IPermissionInfo, defaultPermission: boolean, defaultEntry?: ConfigEntry) {
        this.name = info.name;
        this.description = info.description;
        this.fullName = info.name;
        this.defaultEntry = defaultEntry || new BooleanConfigEntry({
            description: info.description,
            name: info.name,
        }, defaultPermission);
    }

    public setPermissions(permissions: Permissions) {
        this.permissions = permissions;
        this.logger = permissions.logger;
    }

    public setParent(parent: Permission) {
        this.parent = parent;
    }

    public updateFullName() {
        if (this.parent) { this.fullName = this.parent.fullName + "." + this.name; }
    }

    public getConfigEntry() {
        return this.defaultEntry;
    }

    public async checkFull(member: GuildMember): Promise<boolean> {
        const result = await this.checkFullNoDefault(member);
        if (result !== undefined) {
            return result;
        }
        this.logger!.debug(`Returning default for permission ${this.fullName} for member ${member.id}`);
        return this.getDefault();
    }

    public async checkFullNoDefault(member: GuildMember): Promise<boolean|undefined> {
        this.logger!.debug(`Checking for permission ${this.fullName} for member ${member.id}`);
        this.ensureRepo();
        let result = await this.checkMember(member);
        if (result !== undefined) {
            this.logger!.debug(`Found member-specific entry for permission ${this.fullName} for member ${member.id}`);
            return result;
        }
        result = await this.checkRoles(member);
        if (result !== undefined) {
            this.logger!.debug(`Found role-specific entry for permission ${this.fullName} for member ${member.id}`);
            return result;
        }
        if (this.parent) {
            this.logger!.debug(`Checking parent permission for permission ${this.fullName} for member ${member.id}`);
            result = await this.parent.checkFullNoDefault(member);
            if (result !== undefined) {
                return result;
            }
        }
    }

    public async checkRole(role: Role): Promise<boolean> {
        const result = await this.checkRoleNoDefault(role);
        if (result !== undefined) {
            return result;
        }
        this.logger!.debug(`Returning default for permission ${this.fullName} for role ${role.id}`);
        return this.getDefault();
    }

    public async checkRoleNoDefault(role: Role): Promise<boolean|undefined> {
        this.logger!.debug(`Checking for permission ${this.fullName} for role ${role.id}`);
        this.ensureRepo();
        let result = await this.checkRolePart(role);
        if (result !== undefined) {
            this.logger!.debug(`Found role-specific entry for permission ${this.fullName} for role ${role.id}`);
            return result;
        }
        if (this.parent) {
            this.logger!.debug(`Checking parent permission for permission ${this.fullName} for role ${role.id}`);
            result = await this.parent.checkRoleNoDefault(role);
            if (result !== undefined) {
                return result;
            }
        }
    }

    private async checkMember(member: GuildMember): Promise<boolean|undefined> {
        const memberEntity = await this.permissions!.database.repos.member!.getEntity(member);
        const permission = await this.memberRepo!.findOne({
            member: memberEntity,
            name: this.fullName,
        });
        if (permission) {
            return permission.permission;
        }
    }

    private async checkRoles(member: GuildMember): Promise<boolean|undefined> {
        // Roles sorted by position, TODO optimize speed (get all from database and check positions after?)
        for (const role of Array.from(member.roles.values()).sort(Role.comparePositions)) {
            const permission = await this.checkRolePart(role);
            if (permission !== undefined) { return permission; }
        }
    }

    private async checkRolePart(role: Role) {
        const roleEntity = await this.roleRepo!.findOne({where: {
            guildId: role.guild.id,
            roleId: role.id,
        }});
        if (roleEntity) {
            return roleEntity.permission;
        }
    }

    private getDefault() {
        if (this.defaultEntry instanceof BooleanConfigEntry) {
            return this.defaultEntry.get();
        } else {
            return false;
        }
    }

    private ensureRepo() {
        if (this.memberRepo && this.roleRepo) { return; }
        this.memberRepo = this.permissions!.database.connection!.getRepository(MemberPermissionEntity);
        this.roleRepo = this.permissions!.database.connection!.getRepository(RolePermissionEntity);
    }
}

export interface IPermissionInfo {
    name: string;
    description: string;
}
