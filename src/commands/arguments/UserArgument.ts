import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteractionOption } from "discord.js";
import { Database } from "../../database/Database";
import { UserRepository } from "../../database/repo/UserRepository";
import { IExtendedUser } from "../../util/Types";
import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

const MENTION_REGEX = /^<@!?(\d+)>$/;

/**
 * A command argument resolving to a user the bot is aware of.
 * @typeparam T A boolean representing whether the argument is optional.
 * @category Command Argument
 */
export class UserArgument<T extends boolean> extends Argument<Promise<IExtendedUser>, T, string> {
    public repo?: UserRepository;

    /**
     * Creates a new user argument.
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
        const match = MENTION_REGEX.exec(data);
        if (!match) {
            return error(CommandPhrases.invalidUserArgument);
        }
        const id = match[1];
        if (!context.bot.client!.users.fetch(id)) {
            return error(CommandPhrases.invalidUserMentionArgument);
        }
        return id;
    }

    public async parse(data: string, context: ICommandContext, passed: string): Promise<IExtendedUser> {
        this.ensureRepo(context.bot.database);
        const user = context.bot.client!.users.cache.get(passed)!;
        return {
            entity: await this.repo.getEntity(user),
            user,
        };
    }

    public async checkOption(
        data: CommandInteractionOption,
        context: ICommandContext,
        error: ILinkedErrorResponse,
    ): Promise<string | undefined> {
        if (data.user === undefined) {
            return error(CommandPhrases.invalidUserArgument);
        }

        return data.user.id;
    }

    public parseOption(
        data: CommandInteractionOption,
        context: ICommandContext,
        passed: string,
    ): Promise<IExtendedUser> {
        return this.parse("", context, passed);
    }

    public addIntoSlashCommand(builder: SlashCommandBuilder | SlashCommandSubcommandBuilder, language: string) {
        builder.addUserOption((option) =>
            option.setName(this.localizedName.get(language))
                .setDescription(this.localizedDescription.get(language))
                .setRequired(!this.optional),
        );
    }

    private ensureRepo(database: Database): asserts this is this & { repo: UserRepository } {
        if (!this.repo) {
            database.ensureConnection();
            this.repo = database.repos.user;
        }
    }
}
