import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteractionOption, GuildMember } from "discord.js";
import { Database } from "../../database/Database";
import { MemberRepository } from "../../database/repo/MemberRepository";
import { IExtendedMember } from "../../util/Types";
import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

const MENTION_REGEX = /^<@!?(\d+)>$/;

/**
 * A command argument resolving to a member of the relevant guild.
 * @typeparam T A boolean representing whether the argument is optional.
 * @category Command Argument
 */
export class MemberArgument<T extends boolean> extends Argument<Promise<IExtendedMember>, T, string> {
    public repo?: MemberRepository;

    /**
     * Creates a new member argument.
     * @param info Defines basic argument parameters.
     * @param optional Allows the argument to be omitted.
     * @param database The database for returned extended members.
     */
    constructor(info: IArgumentInfo, optional: T, database: Database) {
        super(info, optional, false);
    }

    public async check(
        data: string,
        context: ICommandContext,
        error: ILinkedErrorResponse,
    ): Promise<string | undefined> {
        const match = MENTION_REGEX.exec(data);
        if (!match) {
            return error(CommandPhrases.invalidMemberArgument);
        }
        const id = match[1];
        if (!await context.guild.guild.members.fetch(id)) {
            return error(CommandPhrases.invalidMemberMentionArgument);
        }
        return id;
    }

    public async parse(data: string, context: ICommandContext, passed: string): Promise<IExtendedMember> {
        this.ensureRepo(context.bot.database);
        const member = context.guild.guild.members.cache.get(passed)!;
        return {
            entity: await this.repo.getEntity(member),
            member,
            getVoiceState: () => member.voice,
        };
    }

    public async checkOption(
        data: CommandInteractionOption,
        context: ICommandContext,
        error: ILinkedErrorResponse,
    ): Promise<string | undefined> {
        if (!(data.member instanceof GuildMember)) {
            return error(CommandPhrases.invalidMemberArgument);
        }
        return data.member.id;
    }

    public async parseOption(
        data: CommandInteractionOption,
        context: ICommandContext,
        passed: string,
    ): Promise<IExtendedMember> {
        return this.parse("", context, passed);
    }

    public addIntoSlashCommand(builder: SlashCommandBuilder | SlashCommandSubcommandBuilder, language: string) {
        builder.addUserOption((option) =>
            option.setName(this.localizedName.get(language))
                .setDescription(this.localizedDescription.get(language))
                .setRequired(!this.optional),
        );
    }

    private ensureRepo(database: Database): asserts this is this & { repo: MemberRepository } {
        if (!this.repo) {
            database.ensureConnection();
            this.repo = database.repos.member;
        }
    }
}
