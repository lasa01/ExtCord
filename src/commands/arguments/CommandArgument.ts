import { Command, ILinkedErrorResponse } from "../Command";
import { CommandPhrases } from "../CommandPhrases";
import { ICommandContext } from "../Commands";
import { Argument, IArgumentInfo } from "./Argument";

export class CommandArgument<T extends boolean> extends Argument<Command<any>, T, Command<any>> {
    constructor(info: IArgumentInfo, optional: T, allowSubcommands = false) {
        super(info, optional, allowSubcommands);
    }

    public async check(data: string, context: ICommandContext, error: ILinkedErrorResponse):
        Promise<Command<any>|undefined> {
        const c = this.allowCombining ?
            await context.bot.commands.getCommandInstanceRecursive(context.message.guild, context.language, data) :
            await context.bot.commands.getCommandInstance(context.message.guild, context.language, data);
        if (!c) {
            return error(CommandPhrases.invalidCommandArgument);
        }
        return c;
    }
    public parse(data: string, context: ICommandContext, passed: Command<any>): Command<any> {
        return passed;
    }
}
