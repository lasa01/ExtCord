import Discord from "discord.js";
import { Repository } from "typeorm";

import Database from "../../../database/database";
import { IEntryInfo } from "../entry";
import StringConfigEntry from "../stringentry";
import StringConfigEntity from "./database/stringconfigentity";

export default class StringGuildConfigEntry extends StringConfigEntry {
    private database: Database;
    private repo?: Repository<StringConfigEntity>;

    constructor(info: IEntryInfo, database: Database, defaultValue?: string) {
        info.loadStage = 1;
        super(info, defaultValue);
        this.database = database;
    }

    public async guildGet(guild: Discord.Guild): Promise<string> {
        const entity = await this.guildGetEntity(guild);
        return entity.value;
    }

    public async guildSet(guild: Discord.Guild, value: string) {
        const entity = await this.guildGetEntity(guild);
        entity.value = value;
        await this.repo!.save(entity);
    }

    private async ensureRepo() {
        if (this.repo) { return; }
        this.repo = await this.database.connection!.getRepository(StringConfigEntity);
    }

    private async guildGetEntity(guild: Discord.Guild) {
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
