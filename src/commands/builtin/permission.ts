import { Bot } from "../../Bot";
import { RoleEntity } from "../../database/entity/RoleEntity";
import { MessagePhrase } from "../../language/phrase/MessagePhrase";
import { IExtendedMember, IExtendedRole } from "../../util/Types";
import { MemberOrRoleArgument } from "../arguments/MemberOrRoleArgument";
import { PermissionArgument } from "../arguments/PermissionArgument";
import { CommandGroup } from "../CommandGroup";
import { SimpleCommand } from "../SimpleCommand";

function isRole(input: IExtendedMember | IExtendedRole): input is IExtendedRole {
    return input.entity instanceof RoleEntity;
}

export = (bot: Bot) => {
    const permissionListPhrase = new MessagePhrase(
        {
            description: "Shown when permissions are listed",
            name: "permissionList",
        },
        "{target} has the following permissions:\n{permissions}",
        {
            description: "{target} has the following permissions:\n{permissions}",
            timestamp: false,
            title: "Permissions listed",
        },
        {
            permissions: "The target's permissions",
            target: "The user/role whose permissions were requested",
        },
    );

    const permissionCheckHasPhrase = new MessagePhrase(
        {
            description: "Shown when a permission is checked and is allowed",
            name: "permissionCheckHas",
        },
        "{target} has the permission `{permission}`.",
        {
            description: "{target} has the permission `{permission}`.",
            timestamp: false,
            title: "Permission checked",
        },
        {
            permission: "The permission",
            target: "The user/role which was checked",
        },
    );

    const permissionCheckHasNotPhrase = new MessagePhrase(
        {
            description: "Shown when a permission is checked and is not allowed",
            name: "permissionCheckHasNot",
        },
        "{target} doesn't have the permission `{permission}`.",
        {
            description: "{target} doesn't have the permission `{permission}`.",
            timestamp: false,
            title: "Permission checked",
        },
        {
            permission: "The permission",
            target: "The user/role which was checked",
        },
    );

    const permissionGrantPhrase = new MessagePhrase(
        {
            description: "Shown when a permission is granted",
            name: "permissionGrant",
        },
        "Permission `{permission}` granted for {target}.",
        {
            description: "Permission `{permission}` granted for {target}.",
            timestamp: false,
            title: "Permission granted",
        },
        {
            permission: "The granted permission",
            target: "Receiver of the permission",
        },
    );

    const permissionNoPermissionPhrase = new MessagePhrase(
        {
            description: "Shown when someone tries to manage a permission they don't have",
            name: "permissionNoPermission",
        },
        "You can not manage permission `{permission}` since you don't have it.",
        {
            description: "You can not manage permission `{permission}` since you don't have it.",
            timestamp: false,
            title: "Insufficient permissions",
        },
        {
            permission: "The permission",
        },
    );

    const permissionDenyPhrase = new MessagePhrase(
        {
            description: "Shown when a permission is denied",
            name: "permissionDeny",
        },
        "Permission `{permission}` denied for {target}.",
        {
            description: "Permission `{permission}` denied for {target}.",
            timestamp: false,
            title: "Permission denied",
        },
        {
            permission: "The denied permission",
            target: "Receiver of the permission",
        },
    );

    const permissionRemovePhrase = new MessagePhrase(
        {
            description: "Shown when a permission is removed",
            name: "permissionRemove",
        },
        "Permission `{permission}` removed from {target}.",
        {
            description: "Permission `{permission}` removed from {target}.",
            timestamp: false,
            title: "Permission removed",
        },
        {
            permission: "The removed permission",
            target: "Where the permission was removed from",
        },
    );

    const permissionListCommand = new SimpleCommand(
        {
            allowedPrivileges: ["everyone"],
            author: "extcord",
            description: "List the permissions of a member/role",
            name: "list",
        },
        [
            new MemberOrRoleArgument(
                {
                    description: "The member or role whose permissions to list",
                    name: "target",
                },
                true,
                bot.database,
            ),
        ] as const,
        async (context) => {
            const rawTarget = context.arguments[0];
            let target: IExtendedMember | IExtendedRole;
            if (!rawTarget) {
                target = context.message.member;
            } else {
                target = await rawTarget;
            }
            let permissions = "";
            let targetString: string;
            if (isRole(target)) {
                for (const [permission, allow] of await context.bot.permissions.getRolePermissionMap(target)) {
                    permissions += `\`${permission}\`: ${allow ? "+" : "-"}\n`;
                }
                targetString = target.role.toString();
            } else {
                for (const [permission, allow] of await context.bot.permissions.getMemberFullPermissionMap(target)) {
                    permissions += `\`${permission}\`: ${allow ? "+" : "-"}\n`;
                }
                targetString = target.member.toString();
            }
            await context.respond(permissionListPhrase, {
                permissions,
                target: targetString,
            });
        },
    );

    const permissionCheckCommand = new SimpleCommand(
        {
            allowedPrivileges: ["admin"],
            author: "extcord",
            description: "Check if a member/role has a permission",
            name: "check",
        },
        [
            new MemberOrRoleArgument(
                {
                    description: "The member or role to check",
                    name: "target",
                },
                false,
                bot.database,
            ),
            new PermissionArgument(
                {
                    description: "The permission to check",
                    name: "permission",
                },
                false,
            ),
        ] as const,
        async (context) => {
            const [target, permission] = context.arguments;
            const resolvedTarget = await target;
            let result: boolean;
            let targetString: string;
            if (isRole(resolvedTarget)) {
                result = await permission.checkRole(resolvedTarget);
                targetString = resolvedTarget.role.toString();
            } else {
                result = await permission.checkMember(resolvedTarget);
                targetString = resolvedTarget.member.toString();
            }
            if (result) {
                await context.respond(permissionCheckHasPhrase, {
                    permission: permission.fullName,
                    target: targetString,
                });
            } else {
                await context.respond(permissionCheckHasNotPhrase, {
                    permission: permission.fullName,
                    target: targetString,
                });
            }
        },
    );

    const permissionGrantCommand = new SimpleCommand(
        {
            allowedPrivileges: ["admin"],
            author: "extcord",
            description: "Grant a permission to a member/role",
            name: "grant",
        },
        [
            new MemberOrRoleArgument(
                {
                    description: "The member or role which receives the permission",
                    name: "target",
                },
                false,
                bot.database,
            ),
            new PermissionArgument(
                {
                    description: "The permission to grant",
                    name: "permission",
                },
                false,
            ),
        ] as const,
        async (context) => {
            const [target, permission] = context.arguments;
            if (!await context.bot.permissions.checkMemberPermission(permission, context.message.member)) {
                return context.respond(permissionNoPermissionPhrase, {
                    permission: permission.fullName,
                });
            }
            const resolvedTarget = await target;
            let targetString: string;
            if (isRole(resolvedTarget)) {
                await context.bot.permissions.roleAddPermission(resolvedTarget, permission.fullName);
                targetString = resolvedTarget.role.toString();
            } else {
                await context.bot.permissions.memberAddPermission(resolvedTarget, permission.fullName);
                targetString = resolvedTarget.member.toString();
            }
            await context.respond(permissionGrantPhrase, {
                permission: permission.fullName,
                target: targetString,
            });
        },
    );

    const permissionDenyCommand = new SimpleCommand(
        {
            allowedPrivileges: ["admin"],
            author: "extcord",
            description: "Deny a permission from a member/role",
            name: "deny",
        },
        [
            new MemberOrRoleArgument(
                {
                    description: "The member or role which receives the permission",
                    name: "target",
                },
                false,
                bot.database,
            ),
            new PermissionArgument(
                {
                    description: "The permission to deny",
                    name: "permission",
                },
                false,
            ),
        ] as const,
        async (context) => {
            const [target, permission] = context.arguments;
            if (!await context.bot.permissions.checkMemberPermission(permission, context.message.member)) {
                return context.respond(permissionNoPermissionPhrase, {
                    permission: permission.fullName,
                });
            }
            const resolvedTarget = await target;
            let targetString: string;
            if (isRole(resolvedTarget)) {
                await context.bot.permissions.roleAddPermission(resolvedTarget, permission.fullName, false);
                targetString = resolvedTarget.role.toString();
            } else {
                await context.bot.permissions.memberAddPermission(resolvedTarget, permission.fullName, false);
                targetString = resolvedTarget.member.toString();
            }
            await context.respond(permissionDenyPhrase, {
                permission: permission.fullName,
                target: targetString,
            });
        },
    );

    const permissionRemoveCommand = new SimpleCommand(
        {
            allowedPrivileges: ["admin"],
            author: "extcord",
            description: "Remove a permission from a member/role",
            name: "remove",
        },
        [
            new MemberOrRoleArgument(
                {
                    description: "The member or role which has the permission",
                    name: "target",
                },
                false,
                bot.database,
            ),
            new PermissionArgument(
                {
                    description: "The permission to remove",
                    name: "permission",
                },
                false,
            ),
        ] as const,
        async (context) => {
            const [target, permission] = context.arguments;
            if (!await context.bot.permissions.checkMemberPermission(permission, context.message.member)) {
                return context.respond(permissionNoPermissionPhrase, {
                    permission: permission.fullName,
                });
            }
            const resolvedTarget = await target;
            let targetString: string;
            if (isRole(resolvedTarget)) {
                await context.bot.permissions.roleRemovePermission(resolvedTarget, permission.fullName);
                targetString = resolvedTarget.role.toString();
            } else {
                await context.bot.permissions.memberRemovePermission(resolvedTarget, permission.fullName);
                targetString = resolvedTarget.member.toString();
            }
            await context.respond(permissionRemovePhrase, {
                permission: permission.fullName,
                target: targetString,
            });
        },
    );

    const permissionCommand = new CommandGroup(
        {
            allowedPrivileges: ["everyone"],
            author: "extcord",
            description: "Manage permissions",
            name: "permission",
        },
    );

    permissionCommand.addSubcommands(
        permissionListCommand, permissionCheckCommand,
        permissionGrantCommand, permissionDenyCommand, permissionRemoveCommand,
    );
    permissionCommand.addPhrases(
        permissionListPhrase, permissionCheckHasNotPhrase, permissionCheckHasPhrase,
        permissionGrantPhrase, permissionDenyPhrase, permissionRemovePhrase,
    );

    return {
        permissionCommand,
    };
};
