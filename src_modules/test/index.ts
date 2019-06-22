import { Bot, MessagePhrase, Module, Permission, SimpleCommand, StringArgument } from "../..";

export default class TestModule extends Module {
    constructor(bot: Bot) {
        super(bot, "lasa01", "test");
        const testPermission = new Permission({
            description: "test",
            name: "test",
        }, true);
        this.registerPermission(testPermission);
        const testPhrase = new MessagePhrase({
            description: "Test command",
            name: "testCommand",
        }, "Test {input}?", {
            description: "Test: {input}?",
            timestamp: false,
            title: "Testing 123",
        }, {
            input: "Argument passed to command",
        });
        this.registerPhrase(testPhrase);
        const testCommand = new SimpleCommand({ description: "Test command", name: "test", author: this },
            [new StringArgument({ description: "Text input for testing", name: "text" }, true, true)],
            async (context) => {
                await context.respond(testPhrase, { input: context.arguments[0] });
            }, true);
        this.registerCommand(testCommand);

        const permResultPhrase = new MessagePhrase({
            description: "Permission command result",
            name: "permissionCommandResult",
        }, "Permission `{permission}` allowed: {result}", {
            description: "Permission `{permission}` allowed: {result}.",
            timestamp: false,
            title: "Permission checked",
        }, {
            permission: "Checked permission",
            result: "Returned result",
        });
        this.registerPhrase(permResultPhrase);
        const permNotFoundPhrase = new MessagePhrase({
            description: "Permission command permission not found",
            name: "permissionCommandNotFound",
        }, "Permission `{permission}` doesn't exist", {
            description: "Permission `{permission}` doesn't exist.",
            timestamp: false,
            title: "Permission not found",
        }, {
            permission: "Checked permission",
        });
        this.registerPhrase(permNotFoundPhrase);
        const permCommand = new SimpleCommand({ description: "Check permission", name: "permission", author: this },
            [new StringArgument({ description: "Permission to check", name: "permission" })], async (context) => {
            const perm = this.bot.permissions.get(context.arguments[0]);
            if (!perm) {
                await context.respond(permNotFoundPhrase, { permission: context.arguments[0] });
            } else {
                const result = await perm.checkFullNoDefault(context.message.member);
                let resultText: string;
                if (result === undefined) {
                    resultText = "undefined";
                } else {
                    resultText = result.toString();
                }
                await context.respond(permResultPhrase, { permission: context.arguments[0], result: resultText });
            }
        }, true);
        this.registerCommand(permCommand);

        const prefixPhrase = new MessagePhrase({
            description: "Prefix command",
            name: "prefixCommand",
        }, "Prefix updated to `{prefix}`", {
            description: "New prefix is `{prefix}`.",
            timestamp: false,
            title: "Prefix updated",
        }, {
            prefix: "New prefix",
        });
        this.registerPhrase(prefixPhrase);
        const prefixCommand = new SimpleCommand({ description: "Change prefix", name: "prefix", author: this },
        [new StringArgument({ description: "New prefix", name: "prefix" })], async (context) => {
            await this.bot.commands.prefixConfigEntry!.guildSet(context.message.guild, context.arguments[0]);
            await context.respond(prefixPhrase, { prefix: context.arguments[0] });
        });
        this.registerCommand(prefixCommand);

        const languagePhrase = new MessagePhrase({
            description: "Language command",
            name: "languageCommand",
        }, "Language changed to `{language}`", {
            description: "New language: `{language}`.",
            timestamp: false,
            title: "Language changed",
        }, {
            language: "New language",
        });
        this.registerPhrase(languagePhrase);
        const languageCommand = new SimpleCommand({ description: "Change language", name: "language", author: this },
        [new StringArgument({ description: "New language", name: "language" }, false, false,
        (arg) => this.bot.languages.languages.includes(arg))], async (context) => {
            await this.bot.languages.languageConfigEntry!.guildSet(context.message.guild, context.arguments[0]);
            await context.respond(languagePhrase, { language: context.arguments[0] });
        });
        this.registerCommand(languageCommand);

        const embedPhrase = new MessagePhrase({
            description: "Embed test command",
            name: "embedCommand",
        }, "This is not an embed", {
            description: "The argument provided was: {argument}",
            timestamp: true,
            title: "This is an embed",
            url: "http://www.google.com/",
        }, {
            argument: "The argument provided for the command",
        });
        this.registerPhrase(embedPhrase);
        const embedCommand = new SimpleCommand({ description: "Test embeds", name: "embed", author: this },
        [new StringArgument({ description: "Test argument", name: "test" }, true, true)], async (context) => {
            await context.respond(embedPhrase, { argument: context.arguments[0] });
        }, true);
        this.registerCommand(embedCommand);
    }
}
