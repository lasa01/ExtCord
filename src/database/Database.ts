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

/**
 * The bot's handler for database connection and registering.
 * @category Database
 */
export class Database extends EventEmitter {
    /** Config entry for database connection settings. */
    public configEntry: ObjectConfigEntry;
    /** General database repositories. */
    public repos?: {
        guild: GuildRepository,
        member: MemberRepository,
        user: UserRepository,
        role: RoleRepository,
    };
    /** Database connection, if any. */
    public connection?: Connection;
    private entities: Array<new () => any>;

    /**
     * Creates a database handler.
     */
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

    /**
     * Connects the client to the database.
     * @param options Defines custom connection options instead of the database's config entry.
     */
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

    /**
     * Closes the database connection if it exists.
     */
    public async stop() {
        if (this.connection) {
            await this.connection.close();
            Logger.verbose("Database disconnected");
        }
    }

    /** Reloads the database manager. */
    public async reload() {
        if (this.connection) {
            Logger.verbose("Reconnecting database...");
            await this.connection.close();
            await this.connection.connect();
        }
    }

    /**
     * Registers an entity to the database handler.
     * @param model The entity to register.
     */
    public registerEntity(model: new () => any) {
        Logger.debug(`Registering database entity ${model.name}`);
        this.entities.push(model);
    }

    /**
     * Unregisters an entity from the database handler.
     * @param model The entity to unregister.
     */
    public unregisterEntity(model: new () => any) {
        this.entities.splice(this.entities.indexOf(model), 1);
    }

    /**
     * Registers the database handler's config entries to the specified config manager.
     * @param config The config manager to use.
     */
    public registerConfig(config: Config) {
        config.registerEntry(this.configEntry);
    }

    /**
     * Asserts that the database is connected. Throws if it isn't.
     */
    public ensureConnection(): asserts this is this & {
        connection: Connection, repos: NonNullable<Database["repos"]>,
    } {
        if (!this.connection) {
            throw new Error("Database is not connected");
        }
    }
}
