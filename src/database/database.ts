import "reflect-metadata";

import { EventEmitter } from "events";

import { Connection, ConnectionOptions, createConnection } from "typeorm";
import Winston from "winston";

import BooleanGuildConfigDatabaseEntity from "./entity/booleanguildconfigentity";
import GuildDatabaseEntity from "./entity/guildentity";
import MemberDatabaseEntity from "./entity/memberentity";
import NumberGuildConfigDatabaseEntity from "./entity/numberguildconfigentity";
import StringGuildConfigDatabaseEntity from "./entity/stringguildconfigentity";
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
    public connection?: Connection;
    private logger: Winston.Logger;
    private entities: Array<new () => any>;

    constructor(logger: Winston.Logger) {
        super();
        this.logger = logger;
        this.entities = [GuildDatabaseEntity, MemberDatabaseEntity, UserDatabaseEntity,
            BooleanGuildConfigDatabaseEntity, NumberGuildConfigDatabaseEntity, StringGuildConfigDatabaseEntity];
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

    public async register(thing: IDatabaseRegistrable) {
        await thing.databaseRegister(this);
    }

    public registerEntity(model: new () => any) {
        this.entities.push(model);
    }

    public extendEntity(entity: new () => any, extend: object) {
        Object.assign(entity, extend);
    }
}

export interface IDatabaseRegistrable {
    databaseRegister(database: Database): Promise<void>;
}
