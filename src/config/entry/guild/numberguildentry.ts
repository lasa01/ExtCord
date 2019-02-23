import { Guild } from "discord.js";
import { Repository } from "typeorm";

import { Database } from "../../../database/database";
import { IEntryInfo } from "../entry";
import { NumberConfigEntry } from "../numberentry";
import { NumberConfigEntity } from "./database/numberconfigentity";

export class NumberGuildConfigEntry extends NumberConfigEntry {
    private database: Database;
    private repo?: Repository<NumberConfigEntity>;

    constructor(info: IEntryInfo, database: Database, defaultValue?: number) {
        info.loadStage = 1;
        super(info, defaultValue);
        this.database = database;
    }

    public async guildGet(guild: Guild): Promise<number> {
        const entity = await this.guildGetEntity(guild);
        return entity.value;
    }

    public async guildSet(guild: Guild, value: number) {
        const entity = await this.guildGetEntity(guild);
        entity.value = value;
        await this.repo!.save(entity);
    }

    private async ensureRepo() {
        if (this.repo) { return; }
        this.repo = await this.database.connection!.getRepository(NumberConfigEntity);
    }

    private async guildGetEntity(guild: Guild) {
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
        }
        return entity;
    }
}
