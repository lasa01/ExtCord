import { Repository } from "typeorm";

import { Database } from "../../../database/Database";
import { IExtendedGuild } from "../../../util/Types";
import { IEntryInfo } from "../ConfigEntry";
import { NumberConfigEntry } from "../NumberConfigEntry";
import { NumberConfigEntity } from "./database/NumberConfigEntity";

export class NumberGuildConfigEntry extends NumberConfigEntry {
    public repo?: Repository<NumberConfigEntity>;
    private database: Database;
    private cache: Map<string, NumberConfigEntity>;

    constructor(info: IEntryInfo, database: Database, defaultValue?: number) {
        info.loadStage = 1;
        super(info, defaultValue);
        this.database = database;
        this.cache = new Map();
    }

    public async guildGet(guild: IExtendedGuild): Promise<number> {
        const entity = await this.guildGetEntity(guild);
        return entity.value;
    }

    public async guildSet(guild: IExtendedGuild, value: number) {
        this.ensureRepo();
        const entity = await this.guildGetEntity(guild);
        entity.value = value;
        await this.repo.save(entity);
    }

    private ensureRepo(): asserts this is this & { repo: Repository<NumberConfigEntity> } {
        if (this.repo) { return; }
        this.database.ensureConnection();
        this.repo = this.database.connection.getRepository(NumberConfigEntity);
    }

    private async guildGetEntity(guild: IExtendedGuild) {
        if (this.cache.has(guild.guild.id)) {
            return this.cache.get(guild.guild.id)!;
        }
        this.ensureRepo();
        let entity = await this.repo.findOne({
            guild: guild.entity,
            name: this.fullName,
        });
        if (!entity) {
            entity = this.repo.create({
                guild: guild.entity,
                name: this.fullName,
                value: this.get(),
            });
            await this.repo.save(entity);
        }
        this.cache.set(guild.guild.id, entity);
        return entity;
    }
}
