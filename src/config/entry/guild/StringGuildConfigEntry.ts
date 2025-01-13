import { Repository } from "typeorm";

import { Database } from "../../../database/Database";
import { IExtendedGuild } from "../../../util/Types";
import { IEntryInfo } from "../ConfigEntry";
import { StringConfigEntry } from "../StringConfigEntry";
import { StringConfigEntity } from "./database/StringConfigEntity";

/**
 * A per-guild-configurable string config entry with a default value.
 * @category Config
 */
export class StringGuildConfigEntry extends StringConfigEntry {
    /** The database used for guild-specific configuration. */
    public repo?: Repository<StringConfigEntity>;
    private database: Database;
    private cache: Map<string, StringConfigEntity>;

    /**
     * Creates a new string guild config entry.
     * @param info Defines basic entry parameters.
     * @param database The database for guild-specific configuration.
     * @param defaultValue Defines the defaultvalue.
     */
    constructor(info: IEntryInfo, database: Database, defaultValue?: string) {
        info.loadStage = 1;
        super(info, defaultValue);
        this.database = database;
        this.cache = new Map();
    }

    /**
     * Gets the guild-specific value of the entry for the specified guild.
     * @param guild The guild to get the value for.
     */
    public async guildGet(guild: IExtendedGuild): Promise<string> {
        const entity = await this.guildGetEntity(guild);
        return entity.value;
    }

    /**
     * Sets the guild-specific value of the entry for the specified guild.
     * @param guild The guild to set the value for.
     * @param value The new value.
     */
    public async guildSet(guild: IExtendedGuild, value: string) {
        this.ensureRepo();
        const entity = await this.guildGetEntity(guild);
        entity.value = value;
        await this.repo.save(entity);
    }

    private ensureRepo(): asserts this is this & { repo: Repository<StringConfigEntity> } {
        if (this.repo) { return; }
        this.database.ensureConnection();
        this.repo = this.database.connection.getRepository(StringConfigEntity);
    }

    private async guildGetEntity(guild: IExtendedGuild) {
        if (this.cache.has(guild.guild.id)) {
            return this.cache.get(guild.guild.id)!;
        }
        this.ensureRepo();
        let entity = await this.repo.findOneBy({
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
