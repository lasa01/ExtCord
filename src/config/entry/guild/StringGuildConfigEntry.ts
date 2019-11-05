import { Repository } from "typeorm";

import { Database } from "../../../database/Database";
import { ExtendedGuild } from "../../../util/Types";
import { IEntryInfo } from "../ConfigEntry";
import { StringConfigEntry } from "../StringConfigEntry";
import { StringConfigEntity } from "./database/StringConfigEntity";

export class StringGuildConfigEntry extends StringConfigEntry {
    public repo?: Repository<StringConfigEntity>;
    private database: Database;
    private cache: Map<string, StringConfigEntity>;

    constructor(info: IEntryInfo, database: Database, defaultValue?: string) {
        info.loadStage = 1;
        super(info, defaultValue);
        this.database = database;
        this.cache = new Map();
    }

    public async guildGet(guild: ExtendedGuild): Promise<string> {
        const entity = await this.guildGetEntity(guild);
        return entity.value;
    }

    public async guildSet(guild: ExtendedGuild, value: string) {
        this.ensureRepo();
        const entity = await this.guildGetEntity(guild);
        entity.value = value;
        await this.repo.save(entity);
    }

    private ensureRepo(): asserts this is this & { repo: Repository<StringConfigEntity> } {
        if (this.repo) { return; }
        this.repo = this.database.connection!.getRepository(StringConfigEntity);
    }

    private async guildGetEntity(guild: ExtendedGuild) {
        if (this.cache.has(guild.id)) {
            return this.cache.get(guild.id)!;
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
        this.cache.set(guild.id, entity);
        return entity;
    }
}
