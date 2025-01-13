import { In, Repository } from "typeorm";
import { Logger } from "../util/Logger";
import { CustomPrivilegeEntity } from "./database/CustomPrivilegeEntity";
import { CustomPrivilegeIncludeEntity } from "./database/CustomPrivilegeIncludeEntity";
import { CustomPrivilegePermissionEntity } from "./database/CustomPrivilegePermissionEntity";
import { Permission } from "./Permission";
import { PermissionPrivilege } from "./PermissionPrivilege";
import { Permissions } from "./Permissions";

/**
 * A custom, guild-specific permission privilege.
 * @category Permission
 */
export class CustomPrivilege extends PermissionPrivilege {
    private entity: CustomPrivilegeEntity;
    private permissions: Permissions;
    private repo: Repository<CustomPrivilegeEntity>;
    private permissionRepo: Repository<CustomPrivilegePermissionEntity>;
    private includeRepo: Repository<CustomPrivilegeIncludeEntity>;

    /**
     * Creates a new custom privilege.
     * @param permissions The permission manager to use for database repos.
     * @param entity The database entity to create the privilege from.
     */
    constructor(permissions: Permissions, entity: CustomPrivilegeEntity) {
        super(
            {
                description: entity.description,
                name: entity.name,
            },
            entity.permissions.map((perm) => [permissions.get(perm.name)!, perm.allow]),
            [],
        );
        this.permissions = permissions;
        this.entity = entity;
        permissions.ensureRepo();
        this.repo = permissions.repos.customPrivilege;
        this.permissionRepo = permissions.repos.customPrivilegePermission;
        this.includeRepo = permissions.repos.customPrivilegeInclude;
    }

    public async allowPermissions(...permissions: Permission[]) {
        super.allowPermissions(...permissions);
        for (const permission of permissions) {
            const entity = new CustomPrivilegePermissionEntity();
            entity.name = permission.fullName;
            entity.privilege = this.entity;
            entity.allow = true;
            this.entity.permissions.push(entity);
        }
        await this.repo.save(this.entity);
    }

    public async denyPermissions(...permissions: Permission[]) {
        super.denyPermissions(...permissions);
        for (const permission of permissions) {
            const entity = new CustomPrivilegePermissionEntity();
            entity.name = permission.fullName;
            entity.privilege = this.entity;
            entity.allow = false;
            this.entity.permissions.push(entity);
        }
        await this.repo.save(this.entity);
    }

    public async addPermissions(...permissions: Array<[Permission, boolean]>) {
        super.addPermissions(...permissions);
        for (const permission of permissions) {
            const entity = new CustomPrivilegePermissionEntity();
            entity.name = permission[0].fullName;
            entity.privilege = this.entity;
            entity.allow = permission[1];
            this.entity.permissions.push(entity);
        }
        await this.repo.save(this.entity);
    }

    public async removePermissions(...permissions: Permission[]) {
        super.removePermissions(...permissions);
        this.permissionRepo.delete({
            name: In(permissions.map((perm) => perm.fullName)),
            privilege: this.entity,
        });
    }

    public async updateFromRaw(permissions: Permissions, raw: { [key: string]: any }) {
        super.updateFromRaw(permissions, raw);
        this.entity.description = this.description;
        await this.repo.save(this.entity);
        const includes = new Map((await this.includeRepo.findBy({
            name: In(new Array(this.included.values).map((include) => include.name)),
            privilege: this.entity,
        })).map((include) => [include.name, include]));
        for (const [name] of this.included) {
            if (!includes.has(name)) {
                await this.includeRepo.save(this.includeRepo.create({
                    name,
                    privilege: this.entity,
                }));
            }
        }
        for (const [name, include] of includes) {
            if (!this.included.has(name)) {
                await this.includeRepo.remove(include);
            }
        }
        const perms = new Map((await this.permissionRepo.findBy({
            name: In(new Array(this.permissionsMap.values).map((perm) => perm.name)),
            privilege: this.entity,
        })).map((perm) => [perm.name, perm]));
        for (const [perm, allow] of this.permissionsMap) {
            let entity = perms.get(perm.fullName);
            if (!entity) {
                entity = this.permissionRepo.create({
                    allow,
                    name: perm.fullName,
                    privilege: this.entity,
                });
                await this.permissionRepo.save(entity);
            } else if (entity.allow !== allow) {
                entity.allow = allow;
                await this.permissionRepo.save(entity);
            }
        }
        for (const [name, perm] of perms) {
            const permInstance = this.permissions.get(name);
            if (!permInstance || this.permissionsMap.has(permInstance)) {
                await this.permissionRepo.remove(perm);
            }
        }
    }

    /** Registers the included privileges. */
    public async registerIncludes() {
        for (const include of this.entity.includes) {
            const privilege = await this.permissions.getPrivilege(this.entity.guild, include.name);
            if (privilege) {
                this.includePrivileges(privilege);
            } else {
                Logger.warn(`Privilege "${this.name}" includes an invalid privilege "${include.name}"`);
            }
        }
    }
}
