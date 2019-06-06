import { Bot, Command, MessagePhrase, Module, Permission, SimpleCommand, StringArgument } from "../..";

export default class TestModule extends Module {
    private testPermission: Permission;
    private testCommand: Command;
    private permCommand: Command;
    private prefixCommand: Command;
    private languageCommand: Command;
    private embedPhrase: MessagePhrase<{
        argument: string,
    }>;
    private embedCommand: Command;

    constructor(bot: Bot) {
        super(bot, "lasa01", "test");
        this.testPermission = new Permission({
            description: "test",
            name: "test",
        }, true);
        this.registerPermission(this.testPermission);
        this.testCommand = new SimpleCommand({ description: "test", name: "test", author: this },
            [new StringArgument({ description: "text", name: "text" }, true, true)], async (context) => {
            await context.message.reply(`test ${context.arguments[0]}`);
        }, true);

        this.registerCommand(this.testCommand);
        this.permCommand = new SimpleCommand({ description: "Permission", name: "permission", author: this },
            [new StringArgument({ description: "permission", name: "permission" })], async (context) => {
            const perm = await this.bot.permissions.get(context.arguments[0]);
            if (!perm) {
                await context.message.reply("Permission not found");
            } else {
                const result = await perm.checkFullNoDefault(context.message.member);
                await context.message.reply(`Permission: ${result}`);
            }
        }, true);
        this.registerCommand(this.permCommand);
        this.prefixCommand = new SimpleCommand({ description: "Prefix", name: "prefix", author: this },
        [new StringArgument({ description: "new prefix", name: "prefix" })], async (context) => {
            await this.bot.commands.prefixConfigEntry!.guildSet(context.message.guild, context.arguments[0]);
            await context.message.reply("Prefix updated");
        });
        this.registerCommand(this.prefixCommand);
        this.languageCommand = new SimpleCommand({ description: "Change language", name: "language", author: this },
        [new StringArgument({ description: "new language", name: "language" }, false, false,
        (arg) => this.bot.languages.languages.includes(arg))], async (context) => {
            await this.bot.languages.languageConfigEntry!.guildSet(context.message.guild, context.arguments[0]);
            await context.message.reply("Language updated");
        });
        this.registerCommand(this.languageCommand);

        this.embedPhrase = new MessagePhrase({
            description: "Embed test command",
            name: "embedCommand",
        }, "This is not an embed", {
            description: "The argument provided was: {argument}",
            thumbnailUrl: "https://en.wikipedia.org/wiki/Google_logo#/media/File:Google_%22G%22_Logo.svg",
            timestamp: true,
            title: "This is an embed",
            url: "http://www.google.com/",
        }, {
            argument: "The argument provided for the command",
        });
        this.registerPhrase(this.embedPhrase);
        this.embedCommand = new SimpleCommand({ description: "Test embeds", name: "embed", author: this },
        [new StringArgument({ description: "Test argument", name: "test" }, true, true)], async (context) => {
            const lang = await this.bot.languages.languageConfigEntry!.guildGet(context.message.guild);
            const stuff = { argument: context.arguments[0] };
            await context.message.reply(this.embedPhrase.format(lang, stuff),
                { embed: this.embedPhrase.formatEmbed(lang, stuff) });
        }, true);
        this.registerCommand(this.embedCommand);
    }
}
