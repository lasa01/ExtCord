import "reflect-metadata";

import { EventEmitter } from "events";

// import Discord from "discord.js";
import { Connection, ConnectionOptions, createConnection } from "typeorm";
import Winston from "winston";

import GuildDatabaseEntity from "./entity/guildentity";
import MemberDatabaseEntity from "./entity/memberentity";
import UserDatabaseEntity from "./entity/userentity";
import LoggerBridge from "./loggerbridge";
import GuildDatabaseRepository from "./repo/guildrepo";
import MemberDatabaseRepository from "./repo/memberrepo";
import UserDatabaseRepository from "./repo/userrepo";

export default class Database extends EventEmitter {
    public repos: {
        guild?: GuildDatabaseRepository,
        member?: MemberDatabaseRepository,
        user?: UserDatabaseRepository,
    };
    private logger: Winston.Logger;
    private connection?: Connection;
    private entities: Array<new () => any>;

    constructor(logger: Winston.Logger) {
        super();
        this.logger = logger;
        this.entities = [GuildDatabaseEntity, MemberDatabaseEntity, UserDatabaseEntity];
        this.repos = {};
        this.once("connected", () => {
            this.repos.guild = this.connection!.getCustomRepository(GuildDatabaseRepository);
            this.repos.member = this.connection!.getCustomRepository(MemberDatabaseRepository);
            this.repos.user = this.connection!.getCustomRepository(UserDatabaseRepository);
        });
    }

    public async connect(options: ConnectionOptions) {
        this.connection = await createConnection(Object.assign(options, {
            entities: this.entities,
            logger: new LoggerBridge(this.logger),
            logging: true,
            synchronize: true,
        }));
        this.emit("connected");
    }

    public registerEntity(model: new () => any) {
        this.entities.push(model);
    }

    public extendEntity(entity: new () => any, extend: object) {
        Object.assign(entity, extend);
    }
}

interface ICOSQL {
    type: "sqlite";
    database: string;
}

interface ICOMS {
    type: "mysql" | "mariadb";
    url?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
}
