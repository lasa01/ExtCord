import { Guild } from "discord.js";
import { Repository } from "typeorm";

import { Database } from "../../../database/Database";
import { IEntryInfo } from "../ConfigEntry";
import { StringConfigEntry } from "../StringConfigEntry";
import { StringConfigEntity } from "./database/StringConfigEntity";

export class StringGuildConfigEntry extends StringConfigEntry {
    private database: Database;
    private repo?: Repository<StringConfigEntity>;
    private cache: Map<string, StringConfigEntity>;

    constructor(info: IEntryInfo, database: Database, defaultValue?: string) {
        info.loadStage = 1;
        super(info, defaultValue);
        this.database = database;
        this.cache = new Map();
    }

    public async guildGet(guild: Guild): Promise<string> {
        const entity = await this.guildGetEntity(guild);
        return entity.value;
    }

    public async guildSet(guild: Guild, value: string) {
        const entity = await this.guildGetEntity(guild);
        entity.value = value;
        await this.repo!.save(entity);
    }

    private async ensureRepo() {
        if (this.repo) { return; }
        this.repo = await this.database.connection!.getRepository(StringConfigEntity);
    }

    private async guildGetEntity(guild: Guild) {
        if (this.cache.has(guild.id)) {
            return this.cache.get(guild.id)!;
        }
        await this.ensureRepo();
        let entity = await this.repo!.findOne({ where: {
            guildId: guild.id,
            name: this.fullName,
        }});
        if (!entity) {
            const guildEntity = await this.database.repos.guild!.getEntity(guild);
            entity = await this.repo!.create({
                guild: guildEntity,
                name: this.fullName,
                value: this.get(),
            });
            await this.repo!.save(entity);
        }
        this.cache.set(guild.id, entity);
        return entity;
    }
}
