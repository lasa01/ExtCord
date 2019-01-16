import Bot from "../../bot";
import Permission from "../../permissions/permission";
import Module from "../module";

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
