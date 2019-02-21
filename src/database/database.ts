import "reflect-metadata";

import EventEmitter from "events";

import { Connection, ConnectionOptions, createConnection } from "typeorm";
import Winston from "winston";

import Config from "../config/config";
import ObjectConfigEntry from "../config/entry/objectentry";
import GuildEntity from "./entity/guildentity";
import MemberEntity from "./entity/memberentity";
import RoleEntity from "./entity/roleentity";
import UserEntity from "./entity/userentity";
import LoggerBridge from "./loggerbridge";
import GuildRepository from "./repo/guildrepo";
import MemberRepository from "./repo/memberrepo";
import RoleRepository from "./repo/rolerepo";
import UserRepository from "./repo/userrepo";

export default class Database extends EventEmitter {
    public configEntry?: ObjectConfigEntry;
    public repos: {
        guild?: GuildRepository,
        member?: MemberRepository,
        user?: UserRepository,
        role?: RoleRepository,
    };
    public connection?: Connection;
    private logger: Winston.Logger;
    private entities: Array<new () => any>;

    constructor(logger: Winston.Logger) {
        super();
        this.logger = logger;
        this.entities = [GuildEntity, MemberEntity, UserEntity, RoleEntity];
        this.repos = {};
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
        this.emit("connected");
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
