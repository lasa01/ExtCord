import "reflect-metadata";

import { EventEmitter } from "events";

import { Connection, ConnectionOptions, createConnection } from "typeorm";
import Winston from "winston";

import BooleanConfigEntity from "../config/entry/guild/database/booleanconfigentity";
import NumberConfigEntity from "../config/entry/guild/database/numberconfigentity";
import StringConfigEntity from "../config/entry/guild/database/stringconfigentity";
import MemberPermissionEntity from "../permissions/database/memberpermissionentity";
import GuildEntity from "./entity/guildentity";
import MemberEntity from "./entity/memberentity";
import UserEntity from "./entity/userentity";
import LoggerBridge from "./loggerbridge";
import GuildRepository from "./repo/guildrepo";
import MemberRepository from "./repo/memberrepo";
import UserRepository from "./repo/userrepo";

export default class Database extends EventEmitter {
    public repos: {
        guild?: GuildRepository,
        member?: MemberRepository,
        user?: UserRepository,
    };
    public connection?: Connection;
    private logger: Winston.Logger;
    private entities: Array<new () => any>;

    constructor(logger: Winston.Logger) {
        super();
        this.logger = logger;
        this.entities = [GuildEntity, MemberEntity, UserEntity,
            BooleanConfigEntity, NumberConfigEntity, StringConfigEntity,
            MemberPermissionEntity];
        this.repos = {};
        this.once("connected", () => {
            this.repos.guild = this.connection!.getCustomRepository(GuildRepository);
            this.repos.member = this.connection!.getCustomRepository(MemberRepository);
            this.repos.user = this.connection!.getCustomRepository(UserRepository);
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
