import { Guild, GuildMember, Message, Role, User } from "discord.js";
import { GuildEntity } from "../database/entity/GuildEntity";
import { MemberEntity } from "../database/entity/MemberEntity";
import { RoleEntity } from "../database/entity/RoleEntity";
import { UserEntity } from "../database/entity/UserEntity";

/**
 * A discord guild extended with a database entity.
 * @category Util
 */
export interface IExtendedGuild {
    /** The discrod guild. */
    guild: Guild;
    /** The guild database entity. */
    entity: GuildEntity;
}

/**
 * A discord member extended with a database entity.
 * @category Util
 */
export interface IExtendedMember {
    /** The discord member. */
    member: GuildMember;
    /** The member database entity. */
    entity: MemberEntity;
}

/**
 * A discord role extended with a database entity.
 * @category Util
 */
export interface IExtendedRole {
    /** The discord role. */
    role: Role;
    /** The role database entity. */
    entity: RoleEntity;
}

/**
 * A discord user extended with a database entity.
 * @category Util
 */
export interface IExtendedUser {
    /** The discord user. */
    user: User;
    /** The user database entity. */
    entity: UserEntity;
}

/**
 * A discord message extended with relevant database entities.
 * @category Util
 */
export interface IExtendedMessage {
    /** The discord message. */
    message: Message;
    /** The extended author. */
    author: IExtendedUser;
    /** The extended guild. */
    guild: IExtendedGuild;
    /** The extended member. */
    member: IExtendedMember;
}
