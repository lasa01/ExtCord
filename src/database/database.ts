import "reflect-metadata";

import { EventEmitter } from "events";

import { Connection, ConnectionOptions, createConnection } from "typeorm";
import { Logger } from "winston";

import { Config } from "../config/config";
import { ObjectConfigEntry } from "../config/entry/objectentry";
import { GuildEntity } from "./entity/guildentity";
import { MemberEntity } from "./entity/memberentity";
import { RoleEntity } from "./entity/roleentity";
import { UserEntity } from "./entity/userentity";
import { LoggerBridge } from "./loggerbridge";
import { GuildRepository } from "./repo/guildrepo";
import { MemberRepository } from "./repo/memberrepo";
import { RoleRepository } from "./repo/rolerepo";
import { UserRepository } from "./repo/userrepo";

export class Database extends EventEmitter {
    public configEntry?: ObjectConfigEntry;
    public repos: {
        guild?: GuildRepository,
        member?: MemberRepository,
        user?: UserRepository,
        role?: RoleRepository,
    };
    public connection?: Connection;
    private logger: Logger;
    private entities: Array<new () => any>;

    constructor(logger: Logger) {
        super();
        this.logger = logger;
        this.entities = [GuildEntity, MemberEntity, UserEntity, RoleEntity];
        this.repos = {};
    }

    // Strongly typed events

    public addListener(event: "ready", listener: () => void): this;
    public addListener(event: string, listener: (...args: any[]) => void) { return super.addListener(event, listener); }

    public emit(event: "ready"): boolean;
    public emit(event: string, ...args: any[]) { return super.emit(event, ...args); }

    public on(event: "ready", listener: () => void): this;
    public on(event: string, listener: (...args: any[]) => void) { return super.on(event, listener); }

    public once(event: "ready", listener: () => void): this;
    public once(event: string, listener: (...args: any[]) => void) { return super.once(event, listener); }

    public prependListener(event: "ready", listener: () => void): this;
    public prependListener(event: string, listener: (...args: any[]) => void) {
        return super.prependListener(event, listener);
    }

    public prependOnceListener(event: "ready", listener: () => void): this;
    public prependOnceListener(event: string, listener: (...args: any[]) => void) {
        return super.prependOnceListener(event, listener);
    }

    public async connect(options?: ConnectionOptions) {
        options = options || this.configEntry!.get() as ConnectionOptions;
        this.logger.info("Connecting to database");
        this.connection = await createConnection(Object.assign(options, {
            entities: this.entities,
            logger: new LoggerBridge(this.logger),
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
            this.logger.info("Database disconnected");
        }
    }

    public registerEntity(model: new () => any) {
        this.logger.debug(`Registering database entity ${model.name}`);
        this.entities.push(model);
    }

    public registerConfig(config: Config) {
        this.configEntry = new ObjectConfigEntry({
            description: "Database configuration for TypeORM",
            name: "database",
        }, {
            database: "bot.sqlite",
            type: "sqlite",
        });
        config.register(this.configEntry);
    }
}
