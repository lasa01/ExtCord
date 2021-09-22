import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteractionOption } from "discord.js";
import { ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

/**
 * A command argument resolving to a floating-point numeral.
 * @typeparam T A boolean representing whether the argument is optional.
 * @category Command Argument
 */
export class FloatArgument<T extends boolean> extends Argument<number, T, number> {
    /** Minimum value the argument accepts. */
    public min: number;
    /** Maximum value the argument accepts. */
    public max: number;

    /**
     * Creates a new float argument.
     * @param info Defines basic argument parameters.
     * @param optional Allows the argument to be omitted.
     * @param min Minimum value accepted for the numeral.
     * @param max Maximum value accepted for the numeral.
     */
    constructor(info: IArgumentInfo, optional: T, min = -Infinity, max = Infinity) {
        super(info, optional, false);
        this.min = min;
        this.max = max;
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse) {
        const float = parseFloat(data);
        if (isNaN(float)) {
            return error(CommandPhrases.invalidNumberArgument);
        }
        if (this.min > float) {
            return error(CommandPhrases.tooSmallArgument, { min: this.min.toString() });
        }
        if (this.max < float) {
            return error(CommandPhrases.tooBigArgument, { max: this.max.toString() });
        }
        return float;
    }

    public parse(data: string, context: ICommandContext, passed: number): number {
        return passed;
    }

    public async checkOption(
        data: CommandInteractionOption,
        context: ICommandContext,
        error: ILinkedErrorResponse,
    ): Promise<number | undefined> {
        if (typeof data.value !== "number") {
            return error(CommandPhrases.invalidNumberArgument);
        }

        if (this.min > data.value) {
            return error(CommandPhrases.tooSmallArgument, { min: this.min.toString() });
        }
        if (this.max < data.value) {
            return error(CommandPhrases.tooBigArgument, { max: this.max.toString() });
        }

        return data.value;
    }

    public parseOption(data: CommandInteractionOption, context: ICommandContext, passed: number): number {
        return passed;
    }

    public addIntoSlashCommand(builder: SlashCommandBuilder | SlashCommandSubcommandBuilder, language: string) {
        builder.addNumberOption((option) =>
            option.setName(this.localizedName.get(language))
                .setDescription(this.localizedDescription.get(language))
                .setRequired(!this.optional),
        );
    }
}
