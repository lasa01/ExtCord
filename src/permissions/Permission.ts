import { GuildMember, Role } from "discord.js";
import { In, Repository } from "typeorm";

import { BooleanConfigEntry } from "../config/entry/BooleanConfigEntry";
import { ConfigEntry } from "../config/entry/ConfigEntry";
import { RoleEntity } from "../database/entity/RoleEntity";
import { RoleRepository } from "../database/repo/RoleRepository";
import { Phrase } from "../language/phrase/Phrase";
import { PhraseGroup } from "../language/phrase/PhraseGroup";
import { SimplePhrase } from "../language/phrase/SimplePhrase";
import { Logger } from "../util/Logger";
import { MemberPermissionEntity } from "./database/MemberPermissionEntity";
import { RolePermissionEntity } from "./database/RolePermissionEntity";
import { Permissions } from "./Permissions";

export class Permission {
    public name: string;
    public fullName: string;
    public description?: string;
    public localizedDescription?: SimplePhrase;
    public phraseGroup: PhraseGroup;
    private subPhrases: Phrase[];
    private subPhraseGroup?: PhraseGroup;
    private phrases: Phrase[];
    private permissions?: Permissions;
    private memberPermissionRepo?: Repository<MemberPermissionEntity>;
    private rolePermissionRepo?: Repository<RolePermissionEntity>;
    private roleRepo?: RoleRepository;
    private defaultEntry: ConfigEntry;
    private parent?: Permission;
    private fullCache: Map<string, boolean|undefined>;

    constructor(info: IPermissionInfo, defaultPermission: boolean|ConfigEntry) {
        this.name = info.name;
        this.description = info.description;
        if (this.description) {
            this.localizedDescription = new SimplePhrase({
                name: "description",
            }, this.description);
        }
        this.subPhrases = [];
        this.fullName = info.name;
        this.defaultEntry = defaultPermission instanceof ConfigEntry ? defaultPermission : new BooleanConfigEntry({
            description: info.description,
            name: info.name,
        }, defaultPermission);
        if (this.localizedDescription) {
            this.phrases = [this.localizedDescription];
        } else {
            this.phrases = [];
        }
        if (this.subPhrases.length !== 0) { // TODO: length is always 0, fix
            this.subPhraseGroup = new PhraseGroup({
                name: "phrases",
            }, this.subPhrases);
            this.phrases.push(this.subPhraseGroup);
        }
        this.phraseGroup = new PhraseGroup({
            name: this.name,
        }, this.phrases);
        this.fullCache = new Map();
    }

    public registerSelf(permissions: Permissions) {
        this.permissions = permissions;
    }

    public unregisterSelf() {
        this.permissions = undefined;
    }

    public registerPhrase(phrase: Phrase) {
        this.subPhrases.push(phrase);
    }

    public unregisterPhrase(phrase: Phrase) {
        this.subPhrases.splice(this.subPhrases.indexOf(phrase), 1);
    }

    public registerParent(parent: Permission) {
        this.parent = parent;
        parent.registerPhrase(this.phraseGroup);
    }

    public unregisterParent(parent: Permission) {
        parent.unregisterPhrase(this.phraseGroup);
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
        Logger.debug(`Returning default for permission ${this.fullName} for member ${member.id}`);
        return this.getDefault();
    }

    public async checkFullNoDefault(member: GuildMember): Promise<boolean|undefined> {
        const uid = + member.guild.id + member.user.id;
        if (this.fullCache.has(uid)) {
            return this.fullCache.get(uid);
        }
        Logger.debug(`Checking for permission ${this.fullName} for member ${member.id}`);
        this.ensureRepo();
        let result = await this.checkMember(member);
        if (result !== undefined) {
            Logger.debug(`Found member-specific entry for permission ${this.fullName} for member ${member.id}`);
            this.fullCache.set(uid, result);
            return result;
        }
        result = await this.checkRoles(member);
        if (result !== undefined) {
            Logger.debug(`Found role-specific entry for permission ${this.fullName} for member ${member.id}`);
            this.fullCache.set(uid, result);
            return result;
        }
        if (this.parent) {
            Logger.debug(`Checking parent permission for permission ${this.fullName} for member ${member.id}`);
            result = await this.parent.checkFullNoDefault(member);
            if (result !== undefined) {
                this.fullCache.set(uid, result);
                return result;
            }
        }
        this.fullCache.set(uid, result);
    }

    public async checkRole(role: Role): Promise<boolean> {
        const result = await this.checkRoleNoDefault(role);
        if (result !== undefined) {
            return result;
        }
        Logger.debug(`Returning default for permission ${this.fullName} for role ${role.id}`);
        return this.getDefault();
    }

    public async checkRoleNoDefault(role: Role): Promise<boolean|undefined> {
        Logger.debug(`Checking for permission ${this.fullName} for role ${role.id}`);
        this.ensureRepo();
        let result = await this.checkRolePart(await this.roleRepo!.getEntity(role));
        if (result !== undefined) {
            Logger.debug(`Found role-specific entry for permission ${this.fullName} for role ${role.id}`);
            return result;
        }
        if (this.parent) {
            Logger.debug(`Checking parent permission for permission ${this.fullName} for role ${role.id}`);
            result = await this.parent.checkRoleNoDefault(role);
            if (result !== undefined) {
                return result;
            }
        }
    }

    private async checkMember(member: GuildMember): Promise<boolean|undefined> {
        const memberEntity = await this.permissions!.database.repos.member!.getEntity(member);
        const permission = await this.memberPermissionRepo!.findOne({
            member: memberEntity,
            name: this.fullName,
        });
        if (permission) {
            return permission.permission;
        }
    }

    private async checkRoles(member: GuildMember): Promise<boolean|undefined> {
        const roles = (await this.roleRepo!.find({ where: {
                guildId: member.guild.id,
                roleId: In(member.roles.map((role) => role.id)),
            }}))
            .sort((a, b) => {
                const dA = member.roles.get(a.roleId)!;
                const dB = member.roles.get(b.roleId)!;
                return Role.comparePositions(dA, dB);
            });
        for (const role of roles) {
            const permission = await this.checkRolePart(role);
            if (permission !== undefined) { return permission; }
        }
    }

    private async checkRolePart(role: RoleEntity) {
        const roleEntity = await this.rolePermissionRepo!.findOne({ where: {
            guildId: role.guild.id,
            name: this.fullName,
            roleId: role.id,
        } });
        if (roleEntity) {
            return roleEntity.permission;
        }
    }

    private getDefault() {
        if (this.defaultEntry instanceof BooleanConfigEntry) {
            return this.defaultEntry.get();
        } else {
            return true;
        }
    }

    private ensureRepo() {
        if (this.memberPermissionRepo && this.rolePermissionRepo && this.roleRepo) { return; }
        this.memberPermissionRepo = this.permissions!.database.connection!.getRepository(MemberPermissionEntity);
        this.rolePermissionRepo = this.permissions!.database.connection!.getRepository(RolePermissionEntity);
        this.roleRepo = this.permissions!.database.repos.role;
    }
}

export interface IPermissionInfo {
    name: string;
    description?: string;
}
