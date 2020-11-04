import { Permissions as DiscordPermissions, Role } from "discord.js";
import { ensureDir, readdir, readFile, writeFile } from "fs-extra";
import { resolve } from "path";
import { In, Repository } from "typeorm";

import { Config } from "../config/Config";
import { ConfigEntryGroup } from "../config/entry/ConfigEntryGroup";
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

/**
 * The bot's handler for permission and privilege registering and loading.
 * @category Permission
 */
export class Permissions {
    /** The database used by permissions. */
    public database: Database;
    /** Config entry for the privilege file directory. */
    public privilegeDirConfigEntry: StringConfigEntry;
    /** Config entry for the bot host user id */
    public hostIdConfigEntry: StringConfigEntry;
    /** Privilege for default permissions for everyone. */
    public everyonePrivilege: PermissionPrivilege;
    /** Privilege for default permissions for guild administrators. */
    public adminPrivilege: PermissionPrivilege;
    /** Privilege for default permissions for the bot's owner. */
    public hostPrivilege: PermissionPrivilege;
    /** Database repositories used by permissions. */
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
    private configEntry?: ConfigEntryGroup;

    /**
     * Creates a permission handler.
     * @param database The database to use with permissions.
     */
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
        this.hostIdConfigEntry = new StringConfigEntry({
            description: "The Discord user id to give the bot host permissions for",
            name: "hostId",
        }, "");
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

    /**
     * Registers a permission to the permission handler.
     * @param permission The permission to register.
     */
    public registerPermission(permission: Permission) {
        permission.registerSelf(this);
        this.permissions.set(permission.name, permission);
    }

    /**
     * Unregisters a permission from the permission handler.
     * @param permission The permission to unregister.
     */
    public unregisterPermission(permission: Permission) {
        permission.unregisterSelf();
        this.permissions.delete(permission.name);
    }

    // TODO add directly to group
    /**
     * Registers a phrase to the permission handler.
     * @param phrase The phrase to register.
     */
    public registerPhrase(phrase: Phrase) {
        this.phrases.push(phrase);
    }

    /**
     * Unregisters a phrase from the permission handler.
     * @param phrase The phrase to unregister.
     */
    public unregisterPhrase(phrase: Phrase) {
        this.phrases.splice(this.phrases.indexOf(phrase), 1);
    }

    /**
     * Registers a phrase to the permission handler's privileges.
     * @param phrase The phrase to register.
     */
    public registerPrivilegePhrase(phrase: Phrase) {
        this.privilegePhraseGroup.addPhrases(phrase);
    }

    /**
     * Unregisters a phrase from the permission handler's privileges.
     * @param phrase The phrase to unregister.
     */
    public unregisterPrivilegePhrase(phrase: Phrase) {
        this.privilegePhraseGroup.removePhrases(phrase);
    }

    /**
     * Registers a privilege to the permission handler.
     * @param privilege The privilege to register.
     */
    public registerPrivilege(privilege: PermissionPrivilege) {
        this.privileges.set(privilege.name, privilege);
    }

    /**
     * Unregisters a privilege from the permission handler.
     * @param privilege The privilege to unregister.
     */
    public unregisterPrivilege(privilege: PermissionPrivilege) {
        this.privileges.delete(privilege.name);
    }

    /**
     * Registers the permission handler's config entries.
     * @param config The config handler to register entries to.
     */
    public registerConfig(config: Config) {
        this.configEntry = new ConfigEntryGroup({
            description: "Permissions configuration",
            name: "permissions",
        }, [ this.privilegeDirConfigEntry, this.hostIdConfigEntry ]);
        config.registerEntry(this.configEntry);
    }

    /**
     * Registers the permission handler's phrases.
     * @param languages The language handler to register phrases to.
     */
    public registerLanguages(languages: Languages) {
        this.phraseGroup = new PhraseGroup({
            description: "Built-in permissions",
            name: "permissions",
        }, this.phrases);
        languages.registerPhrase(this.phraseGroup);
        languages.registerPhrase(this.privilegePhraseGroup);
    }

    /**
     * Loads all privilege files and writes missing internal privileges.
     * @param directory Overrides the directory to load privileges from.
     */
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

    /** Reloads the permission handler */
    public async reload() {
        await this.loadAllPrivileges();
        this.rolePermissionMap.clear();
        this.memberPermissionsMap.clear();
        this.memberFullPermissionsMap.clear();
    }

    /**
     * Loads a single privilege file.
     * @param path The path to the privilege file.
     */
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

    /**
     * Loads a single privilege from a string. It is parsed with [[Serializer]].
     * @param content The string to load the privilege from.
     */
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

    /**
     * Writes a privilege to the specified directory.
     * @param privilege The privilege to write to disk.
     * @param directory The directory to write the file to.
     */
    public async writePrivilegeFile(privilege: PermissionPrivilege, directory: string) {
        Logger.verbose(`Writing privilege file ${privilege.name}`);
        const stringified = Serializer.stringify(privilege.getRaw());
        await writeFile(resolve(directory, privilege.name + Serializer.extension), stringified);
    }

    /**
     * Gets the instance of the specified permission by name.
     * @param name The name of the permission.
     */
    public get(name: string) {
        const tree = name.split(".");
        let permission = this.permissions.get(tree.shift()!);
        for (const sub of tree) {
            if (!(permission instanceof PermissionGroup)) { return; }
            permission = permission.children.get(sub);
        }
        return permission;
    }

    /**
     * Gets the instance of the specified privilege by name.
     * Searches first for guild-specific privileges and then fall backs to built-in privileges.
     * @param guild The guild to get guild-specific privileges from.
     * @param name The name of the privilege.
     */
    public async getPrivilege(guild: GuildEntity, name: string): Promise<PermissionPrivilege | undefined> {
        return (await this.getCustomPrivilege(guild, name)) ?? this.getBuiltinPrivilege(name);
    }

    /**
     * Gets the instance of a built-in privilege by name.
     * @param name The name of the privilege.
     */
    public getBuiltinPrivilege(name: string) {
        return this.privileges.get(name);
    }

    /**
     * Gets the instance of a custom privilege by name.
     * @param guild The guild to get the custom privilege from.
     * @param name The name of the privilege.
     */
    public async getCustomPrivilege(guild: GuildEntity, name: string): Promise<CustomPrivilege | undefined> {
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

    /** Gets the current status string of the permission handler. */
    public getStatus() {
        return `${this.permissions.size} permissions loaded: ${Array.from(this.permissions.keys()).join(", ")}`;
    }

    /**
     * Checks if a member has the specified permission.
     * Includes permissions inherited from roles.
     * @param permission The permission to check.
     * @param member The member to use.
     */
    public async checkMemberPermission(permission: Permission, member: IExtendedMember) {
        return (await this.getMemberFullPermissionMap(member)).get(permission.fullName) ?? false;
    }

    /**
     * Checks if a member has the specified permission.
     * Does not include permissions inherited from roles.
     * @param permission The permission to check.
     * @param member The member to use.
     */
    public async checkMemberPermissionOnly(permission: Permission, member: IExtendedMember) {
        return (await this.getMemberPermissionMap(member)).get(permission.fullName) ?? false;
    }

    /**
     * Checks if a role has the specified permission.
     * @param permission The permission to check.
     * @param role The role to use.
     */
    public async checkRolePermission(permission: Permission, role: IExtendedRole) {
        return (await this.getRolePermissionMap(role)).get(permission.fullName) ?? false;
    }

    /** Ensures that [[repos]] are initialized. */
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

    /**
     * Gets a map containing the role's permissions.
     * @param role The role whose permissions to get
     */
    public async getRolePermissionMap(role: IExtendedRole) {
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
        if (role.role.permissions.has(DiscordPermissions.FLAGS.ADMINISTRATOR!)) {
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

    /**
     * Gets a map containing the member's permissions without permissions inherited from roles.
     * @param member The member whose permissions to get
     */
    public async getMemberPermissionMap(member: IExtendedMember) {
        if (this.memberPermissionsMap.has(member.entity.id)) {
            return this.memberPermissionsMap.get(member.entity.id)!;
        }
        this.ensureRepo();
        const map: Map<string, boolean> = new Map();
        let memberPrivileges = await this.repos.memberPrivilege.find({
            member: member.entity,
        });
        const missingPrivilegeEntities: MemberPrivilegeEntity[] = [];
        if (member.member.hasPermission(DiscordPermissions.FLAGS.ADMINISTRATOR!)) {
            if (!memberPrivileges.some((memberPriv) => memberPriv.name === this.adminPrivilege.name)) {
                missingPrivilegeEntities.push(this.repos.memberPrivilege.create({
                    member: member.entity,
                    name: this.adminPrivilege.name,
                }));
            }
        }
        if (member.member.id === this.hostIdConfigEntry.get()) {
            if (!memberPrivileges.some((memberPriv) => memberPriv.name === this.hostPrivilege.name)) {
                missingPrivilegeEntities.push(this.repos.memberPrivilege.create({
                    member: member.entity,
                    name: this.hostPrivilege.name,
                }));
            }
        }
        if (missingPrivilegeEntities.length > 0) {
            await this.repos.memberPrivilege.save(missingPrivilegeEntities);
        }
        memberPrivileges = [...memberPrivileges, ...missingPrivilegeEntities];
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

    /**
     * Gets a map containing the member's permissions including permissions inherited from roles.
     * @param member The member whose permissions to get
     */
    public async getMemberFullPermissionMap(member: IExtendedMember) {
        if (this.memberFullPermissionsMap.has(member.entity.id)) {
            return this.memberFullPermissionsMap.get(member.entity.id)!;
        }
        this.ensureRepo();
        const map: Map<string, boolean> = new Map();
        const roles = (await this.repos.role.find({ relations: ["guild"], where: {
            guild: member.entity.guild,
            roleId: In(member.member.roles.cache.map((role) => role.id)),
        }}))
        .sort((a, b) => {
            const dA = member.member.roles.cache.get(a.roleId)!;
            const dB = member.member.roles.cache.get(b.roleId)!;
            return Role.comparePositions(dA, dB);
        }).map((roleEntity) => ({ role: member.member.roles.cache.get(roleEntity.roleId)!, entity: roleEntity }));

        if (!roles.some((role) => role.role.id === role.role.guild.id)) {
            // Ensure "@everyone" role is in database
            const everyoneRole = member.member.guild.roles.everyone;
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

    /**
     * Add a guild-specific permission override to a role
     * @param role The role to add the permission to
     * @param permission The name of the permission
     * @param allow Whether to allow or deny the permission
     */
    public async roleAddPermission(role: IExtendedRole, permission: string, allow: boolean = true) {
        this.ensureRepo();
        let entity = await this.repos.rolePermission.findOne({
            name: permission,
            role: role.entity,
        });
        if (!entity) {
            entity = this.repos.rolePermission.create({
                name: permission,
                permission: allow,
                role: role.entity,
            });
        } else {
            entity.permission = allow;
        }
        await this.repos.rolePermission.save(entity);
        if (this.rolePermissionMap.has(role.entity.id)) {
            this.rolePermissionMap.get(role.entity.id)!.set(permission, allow);
        }
        // TODO: try to update the map instead of regenerating
        this.memberFullPermissionsMap.clear();
    }

    /**
     * Remove guild-specific permission overrides from a role
     * @param role The role to remove the permission from
     * @param permission The name of the permission
     */
    public async roleRemovePermission(role: IExtendedRole, permission: string) {
        this.ensureRepo();
        await this.repos.rolePermission.delete({
            name: permission,
            role: role.entity,
        });
    }

    /**
     * Add a guild-specific permission override to a member
     * @param member The member to add the permission to
     * @param permission The name of the permission
     * @param allow Whether to allow or deny the permission
     */
    public async memberAddPermission(member: IExtendedMember, permission: string, allow: boolean = true) {
        this.ensureRepo();
        let entity = await this.repos.memberPermission.findOne({
            member: member.entity,
            name: permission,
        });
        if (!entity) {
            entity = this.repos.memberPermission.create({
                member: member.entity,
                name: permission,
                permission: allow,
            });
        } else {
            entity.permission = allow;
        }
        await this.repos.memberPermission.save(entity);
        if (this.memberPermissionsMap.has(member.entity.id)) {
            this.memberPermissionsMap.get(member.entity.id)!.set(permission, allow);
        }
        if (this.memberFullPermissionsMap.has(member.entity.id)) {
            this.memberFullPermissionsMap.get(member.entity.id)!.set(permission, allow);
        }
    }

    /**
     * Remove guild-specific permission overrides from a role
     * @param role The role to remove the permission from
     * @param permission The name of the permission
     */
    public async memberRemovePermission(member: IExtendedMember, permission: string) {
        this.ensureRepo();
        await this.repos.memberPermission.delete({
            member: member.entity,
            name: permission,
        });
    }
}
