import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteractionOption, Role } from "discord.js";
import { Database } from "../../database/Database";
import { RoleRepository } from "../../database/repo/RoleRepository";
import { IExtendedRole } from "../../util/Types";
import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

const MENTION_REGEX = /^<@&(\d+)>$/;

/**
 * A command argument resolving to a role of the relevant guild.
 * @typeparam T A boolean representing whether the argument is optional.
 * @category Command Argument
 */
export class RoleArgument<T extends boolean> extends Argument<Promise<IExtendedRole>, T, string> {
    public repo?: RoleRepository;

    /**
     * Creates a new role argument.
     * @param info Defines basic argument parameters.
     * @param optional Allows the argument to be omitted.
     */
    constructor(info: IArgumentInfo, optional: T) {
        super(info, optional, false);
    }

    public async check(
        data: string,
        context: ICommandContext,
        error: ILinkedErrorResponse,
    ): Promise<string | undefined> {
        if (data === "@everyone") {
            return context.guild.guild.id;
        }
        const match = MENTION_REGEX.exec(data);
        if (!match) {
            return error(CommandPhrases.invalidRoleArgument);
        }
        const id = match[1];
        if (!await context.guild.guild.roles.fetch(id)) {
            return error(CommandPhrases.invalidRoleMentionArgument);
        }
        return id;
    }

    public async parse(data: string, context: ICommandContext, passed: string): Promise<IExtendedRole> {
        this.ensureRepo(context.bot.database);
        const role = context.guild.guild.roles.cache.get(passed)!;
        return {
            entity: await this.repo.getEntity(role),
            role,
        };
    }

    public addIntoSlashCommand(builder: SlashCommandBuilder | SlashCommandSubcommandBuilder, language: string) {
        builder.addRoleOption((option) =>
            option.setName(this.localizedName.get(language))
                .setDescription(this.localizedDescription.get(language))
                .setRequired(!this.optional),
        );
    }

    public async checkOption(
        data: CommandInteractionOption,
        context: ICommandContext,
        error: ILinkedErrorResponse,
    ): Promise<string | undefined> {
        if (!(data.role instanceof Role)) {
            return error(CommandPhrases.invalidRoleArgument);
        }

        return data.role.id;
    }

    public parseOption(
        data: CommandInteractionOption,
        context: ICommandContext,
        passed: string,
    ): Promise<IExtendedRole> {
        return this.parse("", context, passed);
    }

    private ensureRepo(database: Database): asserts this is this & { repo: RoleRepository } {
        if (!this.repo) {
            database.ensureConnection();
            this.repo = database.repos.role;
        }
    }
}
