import Bot from "../../dist/bot";
import StringArgument from "../../dist/commands/arguments/stringargument";
import Command from "../../dist/commands/command";
import SimpleCommand from "../../dist/commands/simplecommand";
import Module from "../../dist/modules/module";
import Permission from "../../dist/permissions/permission";

export default class TestModule extends Module {
    private testPermission: Permission;
    private testCommand: Command;
    private permCommand: Command;
    private prefixCommand: Command;

    constructor(bot: Bot) {
        super(bot, "lasa01", "test");
        this.testPermission = new Permission({
            description: "test",
            name: "test",
        }, true);
        bot.permissions.register(this.testPermission);
        this.testCommand = new SimpleCommand({name: "test", author: this}, [], async (context) => {
            await context.message.reply("test test");
        }, true);
        bot.commands.register(this.testCommand);
        this.permCommand = new SimpleCommand({name: "permission", author: this},
            [new StringArgument({ description: "permission to look up", name: "permission" })], async (context) => {
            const perm = await this.bot.permissions.get(context.arguments[0]);
            if (!perm) {
                await context.message.reply("Permission not found");
            } else {
                const result = await perm.checkFullNoDefault(context.message.member);
                await context.message.reply(`Permission: ${result}`);
            }
        }, true);
        bot.commands.register(this.permCommand);
        this.prefixCommand = new SimpleCommand({name: "prefix", author: this},
        [new StringArgument({ description: "new prefix", name: "prefix" })], async (context) => {
            await this.bot.commands.prefixConfigEntry!.guildSet(context.message.guild, context.arguments[0]);
            await context.message.reply("Prefix updated");
        });
        bot.commands.register(this.prefixCommand);
    }
}
