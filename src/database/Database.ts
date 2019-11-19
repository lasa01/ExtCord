import "reflect-metadata";

import { EventEmitter } from "events";

import { Connection, ConnectionOptions, createConnection } from "typeorm";

import { Config } from "../config/Config";
import { ObjectConfigEntry } from "../config/entry/ObjectConfigEntry";
import { Logger } from "../util/Logger";
import { GuildEntity } from "./entity/GuildEntity";
import { MemberEntity } from "./entity/MemberEntity";
import { RoleEntity } from "./entity/RoleEntity";
import { UserEntity } from "./entity/UserEntity";
import { LoggerBridge } from "./LoggerBridge";
import { GuildRepository } from "./repo/GuildRepository";
import { MemberRepository } from "./repo/MemberRepository";
import { RoleRepository } from "./repo/RoleRepository";
import { UserRepository } from "./repo/UserRepository";

// Event definitions
// tslint:disable-next-line:interface-name
export interface Database {
    /** @event */
    addListener(event: "ready", listener: () => void): this;
    /** @event */
    emit(event: "ready"): boolean;
    /** @event */
    on(event: "ready", listener: () => void): this;
    /** @event */
    once(event: "ready", listener: () => void): this;
    /** @event */
    prependListener(event: "ready", listener: () => void): this;
    /** @event */
    prependOnceListener(event: "ready", listener: () => void): this;
}

export class Database extends EventEmitter {
    public configEntry: ObjectConfigEntry;
    public repos?: {
        guild: GuildRepository,
        member: MemberRepository,
        user: UserRepository,
        role: RoleRepository,
    };
    public connection?: Connection;
    private entities: Array<new () => any>;

    constructor() {
        super();
        this.entities = [GuildEntity, MemberEntity, UserEntity, RoleEntity];
        this.configEntry = new ObjectConfigEntry({
            description: "Database connection configuration for TypeORM\nSee https://typeorm.io/#/connection-options",
            name: "database",
        }, {
            database: "bot.sqlite",
            type: "sqlite",
        });
    }

    public async connect(options?: ConnectionOptions) {
        options = options ?? this.configEntry.get() as ConnectionOptions;
        Logger.verbose("Connecting to database");
        this.connection = await createConnection(Object.assign(options, {
            entities: this.entities,
            logger: new LoggerBridge(Logger),
            logging: true,
            synchronize: true,
        }));
        this.repos = {
            guild: this.connection.getCustomRepository(GuildRepository),
            member: this.connection.getCustomRepository(MemberRepository),
            role: this.connection.getCustomRepository(RoleRepository),
            user: this.connection.getCustomRepository(UserRepository),
        };
        this.emit("ready");
    }

    public async stop() {
        if (this.connection) {
            await this.connection.close();
            Logger.verbose("Database disconnected");
        }
    }

    public registerEntity(model: new () => any) {
        Logger.debug(`Registering database entity ${model.name}`);
        this.entities.push(model);
    }

    public unregisterEntity(model: new () => any) {
        this.entities.splice(this.entities.indexOf(model), 1);
    }

    public registerConfig(config: Config) {
        config.registerEntry(this.configEntry);
    }

    public ensureConnection(): asserts this is this & {
        connection: Connection, repos: NonNullable<Database["repos"]>,
    } {
        if (!this.connection) {
            throw new Error("Database is not connected");
        }
    }
}
