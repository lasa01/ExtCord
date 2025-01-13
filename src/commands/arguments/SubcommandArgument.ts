import { CommandInteractionOption } from "discord.js";
import { ILinkedErrorResponse } from "../Command";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

export class SubcommandArgument extends Argument<ISubcommandData, true, true> {
    constructor(
        info: IArgumentInfo,
    ) {
        super(info, true, true);
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse): Promise<true | undefined> {
        return true;
    }

    public parse(data: string): ISubcommandData {
        const [subcommand, ...args] = data.split(" ");
        return { subcommand, args: args.join(" ") };
    }

    public async checkOption(
        data: CommandInteractionOption,
        context: ICommandContext,
        error: ILinkedErrorResponse,
    ): Promise<true | undefined> {
        return true;
    }

    public parseOption(data: CommandInteractionOption, context: ICommandContext, passed: true): ISubcommandData {
        const subcommand = data.name;
        const args = data.options ?? [];

        return { subcommand, args };
    }
}

export interface ISubcommandData {
    subcommand: string;
    args: string | readonly CommandInteractionOption[];
}
