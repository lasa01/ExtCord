import {
    Bot, DynamicFieldMessagePhrase, IntArgument, MessagePhrase, Module, Permission, SimpleCommand,
    SimplePhrase, StringArgument,
} from "../..";

export default class TestModule extends Module {
    constructor(bot: Bot) {
        super(bot, "lasa01", "test");
        const testPermission = new Permission({
                description: "test",
                name: "test",
            }, true);
        this.registerPermission(testPermission);
        const testPhrase = new MessagePhrase({
                name: "response",
            }, "Test {input}?", {
                description: "Test: {input}?",
                timestamp: false,
                title: "Testing 123",
            }, {
                input: "Argument passed to command",
            });
        const testCommand = new SimpleCommand({ description: "Test command", name: "test", author: this },
            [new StringArgument({ description: "Text input for testing", name: "text" }, false, true)] as const,
            async (context) => {
                await context.respond(testPhrase, { input: context.arguments[0] });
            }, true);
        testCommand.registerPhrase(testPhrase);
        this.registerCommand(testCommand);

        const permResultPhrase = new MessagePhrase({
                name: "permissionResult",
            }, "Permission `{permission}` allowed: {result}", {
                description: "Permission `{permission}` allowed: {result}.",
                timestamp: false,
                title: "Permission checked",
            }, {
                permission: "Checked permission",
                result: "Returned result",
            });
        const permNotFoundPhrase = new MessagePhrase({
                name: "permissionNotFound",
            }, "Permission `{permission}` doesn't exist", {
                description: "Permission `{permission}` doesn't exist.",
                timestamp: false,
                title: "Permission not found",
            }, {
                permission: "Checked permission",
            });
        const permCommand = new SimpleCommand({ description: "Check permission", name: "permission", author: this },
            [new StringArgument({ description: "Permission to check", name: "permission" }, false)] as const,
            async (context) => {
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
        permCommand.registerPhrase(permResultPhrase);
        permCommand.registerPhrase(permNotFoundPhrase);
        this.registerCommand(permCommand);

        const prefixPhrase = new MessagePhrase({
                name: "response",
            }, "Prefix updated to `{prefix}`", {
                description: "New prefix is `{prefix}`.",
                timestamp: false,
                title: "Prefix updated",
            }, {
                prefix: "New prefix",
            });
        const prefixCommand = new SimpleCommand({ description: "Change prefix", name: "prefix", author: this },
            [new StringArgument({ description: "New prefix", name: "prefix" }, false)] as const, async (context) => {
                await this.bot.commands.prefixConfigEntry!.guildSet(context.message.guild, context.arguments[0]);
                await context.respond(prefixPhrase, { prefix: context.arguments[0] });
            });
        prefixCommand.registerPhrase(prefixPhrase);
        this.registerCommand(prefixCommand);

        const languagePhrase = new MessagePhrase({
                name: "response",
            }, "Language changed to `{language}`", {
                description: "New language: `{language}`.",
                timestamp: false,
                title: "Language changed",
            }, {
                language: "New language",
            });
        const invalidLanguagePhrase = new SimplePhrase({
                name: "invalidLanguage",
            }, "The argument is not a valid language");
        const languageCommand = new SimpleCommand({ description: "Change language", name: "language", author: this },
            [new StringArgument({ description: "New language", name: "language" }, false, false,
            async (arg) => {
                if (!this.bot.languages.languages.includes(arg)) {
                    return invalidLanguagePhrase;
                }
            })] as const, async (context) => {
                await this.bot.languages.languageConfigEntry!.guildSet(context.message.guild, context.arguments[0]);
                await context.respond(languagePhrase, { language: context.arguments[0] });
            });
        languageCommand.registerPhrase(languagePhrase);
        languageCommand.registerPhrase(invalidLanguagePhrase);
        this.registerCommand(languageCommand);

        const embedPhrase = new MessagePhrase({
                name: "response",
            }, "This is not an embed", {
                description: "The argument provided was: {argument}",
                fields: [
                    {
                        inline: false,
                        name: "This is a field",
                        value: "Do you believe me?",
                    },
                    {
                        inline: true,
                        name: "And we are *inline*",
                        value: "Isn't that cool?",
                    },
                    {
                        inline: true,
                        name: "And we are *inline*",
                        value: "Isn't that cool?",
                    },
                ],
                timestamp: true,
                title: "This is an embed",
                url: "http://www.google.com/",
            }, {
                argument: "The argument provided for the command",
            });
        const embedCommand = new SimpleCommand({ description: "Test embeds", name: "embed", author: this },
            [new StringArgument({ description: "Test argument", name: "test" }, false, true)] as const,
            async (context) => {
                await context.respond(embedPhrase, { argument: context.arguments[0] });
            }, true);
        embedCommand.registerPhrase(embedPhrase);
        this.registerCommand(embedCommand);

        const randomPhrase = new DynamicFieldMessagePhrase({
                name: "response",
            }, "Random numbers:", {
                description: "Here are your random numbers with an upper limit of {max}.",
                timestamp: false,
                title: "{n} random numbers generated",
            }, "{number}", {
                inline: false,
                name: "A random number",
                value: "is here: {number}",
            }, {
                max: "Generated number upper limit",
                n: "Amount of random numbers",
            }, {
                number: "Random number",
            });
        const randomCommand = new SimpleCommand({
                author: this,
                description: "Random number generator",
                name: "random",
            }, [
                new IntArgument({ description: "Amount of random numbers", name: "amount" }, false, 0, 10),
                new IntArgument({ description: "Maximum number generated", name: "max" }, false, 0),
            ] as const, async (context) => {
                const [n, max] = context.arguments;
                const fields: Array<{ number: string }> = [];
                for (let i = 0; i < n; i++) {
                    fields.push({ number: Math.floor(Math.random() * max).toString() });
                }
                await context.respond(randomPhrase, { n: n.toString(), max: max.toString() }, fields);
            }, true);
        randomCommand.registerPhrase(randomPhrase);
        this.registerCommand(randomCommand);
    }
}
