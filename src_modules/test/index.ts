// extcord module

import { Permissions } from "discord.js";
import {
    Bot, CommandGroup, DynamicFieldMessagePhrase, IntArgument, MessagePhrase, Module, Permission,
    SimpleCommand, StringArgument,
} from "../..";

export default class TestModule extends Module {
    constructor(bot: Bot) {
        super(bot, "lasa01", "test");
        const testPermission = new Permission({
                description: "test",
                name: "test",
            });
        this.registerPermission(testPermission);
        const commandGroup = new CommandGroup({
            allowedPrivileges: ["host"],
            author: this,
            description: "Test commands",
            name: "test",
        });
        const testPhrase = new MessagePhrase({
                name: "response",
            }, "Test {input}?", {
                description: "Test: {input}?",
                timestamp: false,
                title: "Testing 123",
            }, {
                input: "Argument passed to command",
            });
        const testCommand = new SimpleCommand({
            allowedPrivileges: ["host"],
            author: this,
            description: "Test command",
            name: "test",
        },
            [new StringArgument({ description: "Text input for testing", name: "text" }, false, true)] as const,
            async (context) => {
                await context.respond(testPhrase, { input: context.arguments[0] });
            });
        testCommand.addPhrases(testPhrase);
        commandGroup.addSubcommands(testCommand);

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
        const permCommand = new SimpleCommand({
            allowedPrivileges: ["everyone"],
            author: this,
            description: "Check permission",
            name: "permission",
        },
            [new StringArgument({ description: "Permission to check", name: "permission" }, false)] as const,
            async (context) => {
                const perm = this.bot.permissions.get(context.arguments[0]);
                if (!perm) {
                    await context.respond(permNotFoundPhrase, { permission: context.arguments[0] });
                } else {
                    const result = await perm.checkMember(context.message.member);
                    let resultText: string;
                    if (result === undefined) {
                        resultText = "undefined";
                    } else {
                        resultText = result.toString();
                    }
                    await context.respond(permResultPhrase, { permission: context.arguments[0], result: resultText });
                }
            });
        permCommand.addPhrases(permResultPhrase, permNotFoundPhrase);
        this.registerCommand(permCommand);
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
        const embedCommand = new SimpleCommand({
            allowedPrivileges: ["host"],
            author: this,
            description: "Test embeds",
            name: "embed",
        },
            [new StringArgument({ description: "Test argument", name: "test" }, false, true)] as const,
            async (context) => {
                await context.respond(embedPhrase, { argument: context.arguments[0] });
            });
        embedCommand.addPhrases(embedPhrase);
        commandGroup.addSubcommands(embedCommand);

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
                allowedPrivileges: ["everyone"],
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
            });
        randomCommand.addPhrases(randomPhrase);
        commandGroup.addSubcommands(randomCommand);
        this.registerCommand(commandGroup);
    }
}
