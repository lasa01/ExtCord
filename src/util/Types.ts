import { Guild, GuildMember, Message, Role, User } from "discord.js";
import { GuildEntity } from "../database/entity/GuildEntity";
import { MemberEntity } from "../database/entity/MemberEntity";
import { RoleEntity } from "../database/entity/RoleEntity";
import { UserEntity } from "../database/entity/UserEntity";

export interface IExtendedGuild {
    guild: Guild;
    entity: GuildEntity;
}
export interface IExtendedMember {
    member: GuildMember;
    entity: MemberEntity;
}
export interface IExtendedRole {
    role: Role;
    entity: RoleEntity;
}
export interface IExtendedUser {
    user: User;
    entity: UserEntity;
}
export interface IExtendedMessage {
    message: Message;
    author: IExtendedUser;
    guild: IExtendedGuild;
    member: IExtendedMember;
}
