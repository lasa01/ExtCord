import { Permissions as DiscordPermissions, Role } from "discord.js";
import { ensureDir, readdir, readFile, writeFile } from "fs-extra";
import { resolve } from "path";
import { In, Repository } from "typeorm";

import { Config } from "../config/Config";
import { StringConfigEntry } from "../config/entry/StringConfigEntry";
import { Database } from "../database/Database";
import { GuildEntity } from "../database/entity/GuildEntity";
import { MemberRepository } from "../database/repo/MemberRepository";
import { RoleRepository } from "../database/repo/RoleRepository";
import { Languages } from "../language/Languages";
import { Phrase } from "../language/phrase/Phrase";
import { PhraseGroup } from "../language/phrase/PhraseGroup";
import { Logger } from "../util/Logger";
import { Serializer } from "../util/Serializer";
import { IExtendedMember, IExtendedRole } from "../util/Types";
import { CustomPrivilege } from "./CustomPrivilege";
import { CustomPrivilegeEntity } from "./database/CustomPrivilegeEntity";
import { CustomPrivilegeIncludeEntity } from "./database/CustomPrivilegeIncludeEntity";
import { CustomPrivilegePermissionEntity } from "./database/CustomPrivilegePermissionEntity";
import { MemberPermissionEntity } from "./database/MemberPermissionEntity";
import { MemberPrivilegeEntity } from "./database/MemberPrivilegeEntity";
import { RolePermissionEntity } from "./database/RolePermissionEntity";
import { RolePrivilegeEntity } from "./database/RolePrivilegeEntity";
import { Permission } from "./Permission";
import { PermissionGroup } from "./PermissionGroup";
import { PermissionPrivilege } from "./PermissionPrivilege";

export class Permissions {
    public database: Database;
    public privilegeDirConfigEntry: StringConfigEntry;
    public everyonePrivilege: PermissionPrivilege;
    public adminPrivilege: PermissionPrivilege;
    public hostPrivilege: PermissionPrivilege;
    public repos?: {
        memberPermission: Repository<MemberPermissionEntity>;
        rolePermission: Repository<RolePermissionEntity>;
        memberPrivilege: Repository<MemberPrivilegeEntity>;
        rolePrivilege: Repository<RolePrivilegeEntity>;
        role: RoleRepository;
        member: MemberRepository;
        customPrivilege: Repository<CustomPrivilegeEntity>;
        customPrivilegePermission: Repository<CustomPrivilegePermissionEntity>;
        customPrivilegeInclude: Repository<CustomPrivilegeIncludeEntity>;
    };
    private permissions: Map<string, Permission>;
    private rolePermissionMap: Map<number, Map<string, boolean>>;
    private memberPermissionsMap: Map<number, Map<string, boolean>>;
    private memberFullPermissionsMap: Map<number, Map<string, boolean>>;
    private privileges: Map<string, PermissionPrivilege>;
    private customPrivileges: Map<string, Map<string, CustomPrivilege|undefined>>;
    private privilegePhraseGroup: PhraseGroup;
    private phrases: Phrase[];
    private phraseGroup?: PhraseGroup;

    constructor(database: Database) {
        this.database = database;
        this.permissions = new Map();
        this.rolePermissionMap = new Map();
        this.memberPermissionsMap = new Map();
        this.memberFullPermissionsMap = new Map();
        this.privileges = new Map();
        this.customPrivileges = new Map();
        this.privilegePhraseGroup = new PhraseGroup({ name: "privileges", description: "Permission privileges" });
        this.phrases = [];
        database.registerEntity(MemberPermissionEntity);
        database.registerEntity(RolePermissionEntity);
        database.registerEntity(MemberPrivilegeEntity);
        database.registerEntity(RolePrivilegeEntity);
        database.registerEntity(CustomPrivilegeEntity);
        database.registerEntity(CustomPrivilegeIncludeEntity);
        database.registerEntity(CustomPrivilegePermissionEntity);
        this.privilegeDirConfigEntry = new StringConfigEntry({
            description: "The directory for privilege files",
            name: "privilegesDirectory",
        }, "privileges");
        this.everyonePrivilege = new PermissionPrivilege({
            description: "Default permissions for everyone",
            name: "everyone",
        }, undefined, undefined);
        this.registerPrivilege(this.everyonePrivilege);
        this.registerPrivilegePhrase(this.everyonePrivilege.phraseGroup);
        this.adminPrivilege = new PermissionPrivilege({
            description: "Server administrator permissions",
            name: "admin",
        }, undefined, [this.everyonePrivilege]);
        this.registerPrivilege(this.adminPrivilege);
        this.registerPrivilegePhrase(this.adminPrivilege.phraseGroup);
        this.hostPrivilege = new PermissionPrivilege({
            description: "Bot owner permissions",
            name: "host",
        }, undefined, [this.adminPrivilege]);
        this.registerPrivilege(this.hostPrivilege);
        this.registerPrivilegePhrase(this.hostPrivilege.phraseGroup);
    }

    public registerPermission(permission: Permission) {
        permission.registerSelf(this);
        this.permissions.set(permission.name, permission);
    }

    public unregisterPermission(permission: Permission) {
        permission.unregisterSelf();
        this.permissions.delete(permission.name);
    }

    // TODO add directly to group
    public registerPhrase(phrase: Phrase) {
        this.phrases.push(phrase);
    }

    public unregisterPhrase(phrase: Phrase) {
        this.phrases.splice(this.phrases.indexOf(phrase), 1);
    }

    public registerPrivilegePhrase(phrase: Phrase) {
        this.privilegePhraseGroup.addPhrases(phrase);
    }

    public unregisterPrivilegePhrase(phrase: Phrase) {
        this.privilegePhraseGroup.removePhrases(phrase);
    }

    public registerPrivilege(privilege: PermissionPrivilege) {
        this.privileges.set(privilege.name, privilege);
    }

    public unregisterPrivilege(privilege: PermissionPrivilege) {
        this.privileges.delete(privilege.name);
    }

    public registerConfig(config: Config) {
        config.registerEntry(this.privilegeDirConfigEntry);
    }

    public registerLanguages(languages: Languages) {
        this.phraseGroup = new PhraseGroup({
            description: "Built-in permissions",
            name: "permissions",
        }, this.phrases);
        languages.registerPhrase(this.phraseGroup);
        languages.registerPhrase(this.privilegePhraseGroup);
    }

    public async loadAllPrivileges(directory?: string) {
        directory = directory ?? this.privilegeDirConfigEntry.get();
        Logger.verbose("Loading all privileges");
        await ensureDir(directory);
        const dirContent = (await readdir(directory)).filter((file) => file.endsWith(Serializer.extension));
        const internalPrivileges = Array.from(this.privileges.keys());
        for (const filename of dirContent) {
            const path = resolve(directory, filename);
            const privilege = await this.loadPrivilegeFile(path);
            if (privilege && internalPrivileges.includes(privilege.name)) {
                internalPrivileges.splice(internalPrivileges.indexOf(privilege.name), 1);
            }
        }
        // Write remaining internal privileges
        for (const privilege of internalPrivileges) {
            this.writePrivilegeFile(this.privileges.get(privilege)!, directory);
        }
    }

    public async loadPrivilegeFile(path: string) {
        let content;
        try {
            content = await readFile(path, "utf8");
        } catch (err) {
            Logger.error(`An error occured while reading privilege ${path}: ${err}`);
            return;
        }
        return this.loadPrivilegeText(content);
    }

    public async loadPrivilegeText(content: string) {
        let parsed: { [key: string]: any };
        try {
            parsed = Serializer.parse(content);
        } catch (err) {
            Logger.error("An error occured while parsing a privilege: " + err);
            return;
        }
        const name: string = parsed.name;
        let privilege: PermissionPrivilege;
        try {
            if (this.privileges.has(name)) {
                privilege = this.privileges.get(name)!;
                privilege.updateFromRaw(this, parsed);
            } else {
                privilege = PermissionPrivilege.fromRaw(this, parsed);
                this.privileges.set(name, privilege);
            }
            return privilege;
        } catch (err) {
            Logger.error("An error occured while loading a privilege: " + err);
        }
    }

    public async writePrivilegeFile(privilege: PermissionPrivilege, directory: string) {
        Logger.verbose(`Writing privilege file ${privilege.name}`);
        const stringified = Serializer.stringify(privilege.getRaw());
        await writeFile(resolve(directory, privilege.name + Serializer.extension), stringified);
    }

    public get(name: string) {
        const tree = name.split(".");
        let permission = this.permissions.get(tree.shift()!);
        for (const sub of tree) {
            if (!(permission instanceof PermissionGroup)) { return; }
            permission = permission.children.get(sub);
        }
        return permission;
    }

    public async getPrivilege(guild: GuildEntity, name: string) {
        return (await this.getCustomPrivilege(guild, name)) ?? this.getBuiltinPrivilege(name);
    }

    public getBuiltinPrivilege(name: string) {
        return this.privileges.get(name);
    }

    public async getCustomPrivilege(guild: GuildEntity, name: string) {
        if (!this.customPrivileges.has(guild.id)) {
            this.customPrivileges.set(guild.id, new Map());
        } else if (this.customPrivileges.get(guild.id)!.has(name)) {
            return this.customPrivileges.get(guild.id)!.get(name)!;
        }
        this.ensureRepo();
        const entity = await this.repos.customPrivilege.findOne({
            relations: ["includes", "permissions"],
            where: {
                guild,
                name,
            },
        });
        if (entity) {
            const privilege = new CustomPrivilege(this, entity);
            await privilege.registerIncludes();
            this.customPrivileges.get(guild.id)!.set(privilege.name, privilege);
            return privilege;
        }
        this.customPrivileges.get(guild.id)!.set(name, undefined);
    }

    public getStatus() {
        return `${this.permissions.size} permissions loaded: ${Array.from(this.permissions.keys()).join(", ")}`;
    }

    public async checkMemberPermission(permission: Permission, member: IExtendedMember) {
        return (await this.getMemberFullPermissionMap(member)).get(permission.fullName) ?? false;
    }

    public async checkMemberPermissionOnly(permission: Permission, member: IExtendedMember) {
        return (await this.getMemberPermissionMap(member)).get(permission.fullName) ?? false;
    }

    public async checkRolePermission(permission: Permission, role: IExtendedRole) {
        return (await this.getRolePermissionMap(role)).get(permission.fullName) ?? false;
    }

    public ensureRepo(): asserts this is this & { repos: NonNullable<Permissions["repos"]> } {
        if (!this.repos) {
            this.database.ensureConnection();
            const connection = this.database.connection;
            this.repos = {
                customPrivilege: connection.getRepository(CustomPrivilegeEntity),
                customPrivilegeInclude: connection.getRepository(CustomPrivilegeIncludeEntity),
                customPrivilegePermission: connection.getRepository(CustomPrivilegePermissionEntity),
                member: this.database.repos.member,
                memberPermission: connection.getRepository(MemberPermissionEntity),
                memberPrivilege: connection.getRepository(MemberPrivilegeEntity),
                role: this.database.repos.role,
                rolePermission: connection.getRepository(RolePermissionEntity),
                rolePrivilege: connection.getRepository(RolePrivilegeEntity),
            };
        }
    }

    private async getRolePermissionMap(role: IExtendedRole) {
        if (this.rolePermissionMap.has(role.entity.id)) {
            return this.rolePermissionMap.get(role.entity.id)!;
        }
        this.ensureRepo();
        const map: Map<string, boolean> = new Map();
        let rolePrivileges = await this.repos.rolePrivilege.find({
            role: role.entity,
        });
        const missingPrivilegeEntities: RolePrivilegeEntity[] = [];
        // The "@everyone" role has same id as the guild
        if (role.entity.roleId === role.entity.guildId) {
            // Add default privileges to role privilege database for the "@everyone" role
                if (!rolePrivileges.some((rolePriv) => rolePriv.name === this.everyonePrivilege.name)) {
                    missingPrivilegeEntities.push(this.repos.rolePrivilege.create({
                        name: this.everyonePrivilege.name,
                        role: role.entity,
                    }));
            }
        }
        if (role.role.hasPermission(DiscordPermissions.FLAGS.ADMINISTRATOR!)) {
            if (!rolePrivileges.some((rolePriv) => rolePriv.name === this.adminPrivilege.name)) {
                missingPrivilegeEntities.push(this.repos.rolePrivilege.create({
                    name: this.adminPrivilege.name,
                    role: role.entity,
                }));
            }
        }
        if (missingPrivilegeEntities.length > 0) {
            await this.repos.rolePrivilege.save(missingPrivilegeEntities);
        }
        rolePrivileges = [...rolePrivileges, ...missingPrivilegeEntities];
        for (const rolePrivilege of rolePrivileges) {
            const rolePrivilegeInstance = await this.getPrivilege(role.entity.guild, rolePrivilege.name);
            if (!rolePrivilegeInstance) {
                Logger.warn(`Invalid privilege "${rolePrivilege.name}" in role "${role.entity.roleId}"`);
                continue;
            }
            const rolePrivilegePermissions = rolePrivilegeInstance.getPermissionsMap();
            for (const [permission, allow] of rolePrivilegePermissions) {
                map.set(permission.fullName, allow);
            }
        }
        const rolePermissions = await this.repos.rolePermission.find({
            role: role.entity,
        });
        for (const rolePermission of rolePermissions) {
            map.set(rolePermission.name, rolePermission.permission);
        }
        this.rolePermissionMap.set(role.entity.id, map);
        return map;
    }

    private async getMemberPermissionMap(member: IExtendedMember) {
        if (this.memberPermissionsMap.has(member.entity.id)) {
            return this.memberPermissionsMap.get(member.entity.id)!;
        }
        this.ensureRepo();
        const map: Map<string, boolean> = new Map();
        let memberPrivileges = await this.repos.memberPrivilege.find({
            member: member.entity,
        });
        if (member.member.hasPermission(DiscordPermissions.FLAGS.ADMINISTRATOR!)) {
            const missingPrivilegeEntities: MemberPrivilegeEntity[] = [];
            if (!memberPrivileges.some((memberPriv) => memberPriv.name === this.adminPrivilege.name)) {
                missingPrivilegeEntities.push(this.repos.memberPrivilege.create({
                    member: member.entity,
                    name: this.adminPrivilege.name,
                }));
            }
            if (missingPrivilegeEntities.length > 0) {
                await this.repos.memberPrivilege.save(missingPrivilegeEntities);
            }
            memberPrivileges = [...memberPrivileges, ...missingPrivilegeEntities];
        }
        for (const memberPrivilege of memberPrivileges) {
            const memberPrivilegeInstance = await this.getPrivilege(member.entity.guild, memberPrivilege.name);
            if (!memberPrivilegeInstance) {
                Logger.warn(`Invalid privilege "${memberPrivilege.name}" in member "${member.entity.userId}"`);
                continue;
            }
            const memberPrivilegePermissions = memberPrivilegeInstance.getPermissionsMap();
            for (const [permission, allow] of memberPrivilegePermissions) {
                map.set(permission.fullName, allow);
            }
        }

        const memberPermissions = await this.repos.memberPermission.find({
            member: member.entity,
        });
        for (const memberPermission of memberPermissions) {
            map.set(memberPermission.name, memberPermission.permission);
        }
        this.memberPermissionsMap.set(member.entity.id, map);
        return map;
    }

    private async getMemberFullPermissionMap(member: IExtendedMember) {
        if (this.memberFullPermissionsMap.has(member.entity.id)) {
            return this.memberFullPermissionsMap.get(member.entity.id)!;
        }
        this.ensureRepo();
        const map: Map<string, boolean> = new Map();
        const roles = (await this.repos.role.find({ relations: ["guild"], where: {
            guild: member.entity.guild,
            roleId: In(member.member.roles.map((role) => role.id)),
        }}))
        .sort((a, b) => {
            const dA = member.member.roles.get(a.roleId)!;
            const dB = member.member.roles.get(b.roleId)!;
            return Role.comparePositions(dA, dB);
        }).map((roleEntity) => ({ role: member.member.roles.get(roleEntity.roleId)!, entity: roleEntity }));

        if (!roles.some((role) => role.role.id === role.role.guild.id)) {
            // Ensure "@everyone" role is in database
            const everyoneRole = member.member.guild.defaultRole;
            roles.push({ role: everyoneRole, entity: await this.repos.role.getEntity(everyoneRole)});
        }

        for (const role of roles) {
            const roleMap = await this.getRolePermissionMap(role);
            for (const [permission, allow] of roleMap) {
                map.set(permission, allow);
            }
        }

        const memberMap = await this.getMemberPermissionMap(member);
        for (const [permission, allow] of memberMap) {
            map.set(permission, allow);
        }

        this.memberFullPermissionsMap.set(member.entity.id, map);
        return map;
    }
}
