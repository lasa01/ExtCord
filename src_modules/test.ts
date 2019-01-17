import Bot from "../dist/bot";
import Module from "../dist/modules/module";
import Permission from "../dist/permissions/permission";

export default class Test extends Module {
    private testPermission: Permission;

    constructor(bot: Bot) {
        super(bot, "lasa01", "test");
        this.testPermission = new Permission({
            defaultPermission: true,
            name: "test.test",
        }, bot.permissions);
    }
}
