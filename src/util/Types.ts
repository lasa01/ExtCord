import { Guild, GuildMember, Message, Role, User } from "discord.js";
import { GuildEntity } from "../database/entity/GuildEntity";
import { MemberEntity } from "../database/entity/MemberEntity";
import { RoleEntity } from "../database/entity/RoleEntity";
import { UserEntity } from "../database/entity/UserEntity";

export type ExtendedGuild = Guild & {
    entity: GuildEntity,
};
export type ExtendedMember = GuildMember & {
    guild: ExtendedGuild,
    entity: MemberEntity,
    user: ExtendedUser,
};
export type ExtendedRole = Role & {
    guild: ExtendedGuild,
    entity: RoleEntity,
};
export type ExtendedUser = User & {
    entity: UserEntity;
};
export type ExtendedMessage = Message & {
    author: ExtendedUser,
    guild: ExtendedGuild,
    member: ExtendedMember,
};
