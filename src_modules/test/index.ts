import Bot from "../../dist/bot";
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
        this.testCommand = new SimpleCommand("test", this, async (context) => {
            await context.message.reply("test test");
        }, true);
        bot.commands.register(this.testCommand);
        this.permCommand = new SimpleCommand("permission", this, async (context) => {
            const perm = await this.bot.permissions.get(context.arguments);
            if (!perm) {
                await context.message.reply("Permission not found");
            } else {
                const result = await perm.checkFullNoDefault(context.message.member);
                await context.message.reply(`Permission: ${result}`);
            }
        }, true);
        bot.commands.register(this.permCommand);
        this.prefixCommand = new SimpleCommand("prefix", this, async (context) => {
            await this.bot.commands.prefixConfigEntry!.guildSet(context.message.guild, context.arguments);
            await context.message.reply("Prefix updated");
        });
        bot.commands.register(this.prefixCommand);
    }
}
