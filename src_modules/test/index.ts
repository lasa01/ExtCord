import { Bot, Command, Module, Permission, SimpleCommand, StringArgument } from "../..";

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
        this.testCommand = new SimpleCommand({description: "test", name: "test", author: this},
            [new StringArgument({ description: "text", name: "text" }, true, true)], async (context) => {
            await context.message.reply(`test ${context.arguments[0]}`);
        }, true);
        bot.commands.register(this.testCommand);
        this.permCommand = new SimpleCommand({description: "Permission", name: "permission", author: this},
            [new StringArgument({ description: "permission", name: "permission" })], async (context) => {
            const perm = await this.bot.permissions.get(context.arguments[0]);
            if (!perm) {
                await context.message.reply("Permission not found");
            } else {
                const result = await perm.checkFullNoDefault(context.message.member);
                await context.message.reply(`Permission: ${result}`);
            }
        }, true);
        bot.commands.register(this.permCommand);
        this.prefixCommand = new SimpleCommand({description: "Prefix", name: "prefix", author: this},
        [new StringArgument({ description: "new prefix", name: "prefix" })], async (context) => {
            await this.bot.commands.prefixConfigEntry!.guildSet(context.message.guild, context.arguments[0]);
            await context.message.reply("Prefix updated");
        });
        bot.commands.register(this.prefixCommand);
    }
}
