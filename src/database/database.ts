import "reflect-metadata";

import { EventEmitter } from "events";

import { Connection, ConnectionOptions, createConnection } from "typeorm";

import { Config } from "../config/config";
import { ObjectConfigEntry } from "../config/entry/objectentry";
import { Logger } from "../util/logger";
import { GuildEntity } from "./entity/guildentity";
import { MemberEntity } from "./entity/memberentity";
import { RoleEntity } from "./entity/roleentity";
import { UserEntity } from "./entity/userentity";
import { LoggerBridge } from "./loggerbridge";
import { GuildRepository } from "./repo/guildrepo";
import { MemberRepository } from "./repo/memberrepo";
import { RoleRepository } from "./repo/rolerepo";
import { UserRepository } from "./repo/userrepo";

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
    public configEntry?: ObjectConfigEntry;
    public repos: {
        guild?: GuildRepository,
        member?: MemberRepository,
        user?: UserRepository,
        role?: RoleRepository,
    };
    public connection?: Connection;
    private entities: Array<new () => any>;

    constructor() {
        super();
        this.entities = [GuildEntity, MemberEntity, UserEntity, RoleEntity];
        this.repos = {};
    }

    public async connect(options?: ConnectionOptions) {
        options = options || this.configEntry!.get() as ConnectionOptions;
        Logger.verbose("Connecting to database");
        this.connection = await createConnection(Object.assign(options, {
            entities: this.entities,
            logger: new LoggerBridge(Logger),
            logging: true,
            synchronize: true,
        }));
        this.repos.guild = this.connection.getCustomRepository(GuildRepository);
        this.repos.member = this.connection.getCustomRepository(MemberRepository);
        this.repos.user = this.connection.getCustomRepository(UserRepository);
        this.repos.role = this.connection.getCustomRepository(RoleRepository);
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
        this.configEntry = new ObjectConfigEntry({
            description: "Database connection configuration for TypeORM\nSee https://typeorm.io/#/connection-options",
            name: "database",
        }, {
            database: "bot.sqlite",
            type: "sqlite",
        });
        config.registerEntry(this.configEntry);
    }
}
