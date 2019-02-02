import Bot from "../../dist/bot";
import Command from "../../dist/commands/command";
import SimpleCommand from "../../dist/commands/simplecommand";
import Module from "../../dist/modules/module";
import Permission from "../../dist/permissions/permission";

export default class Test extends Module {
    private testPermission: Permission;
    private testCommand: Command;

    constructor(bot: Bot) {
        super(bot, "lasa01", "test");
        this.testPermission = new Permission({
            description: "test",
            name: "test",
        }, true);
        bot.permissions.register(this.testPermission);
        this.testCommand = new SimpleCommand("test", this, async (context) => {
            return;
        });
        bot.commands.register(this.testCommand);
    }
}
