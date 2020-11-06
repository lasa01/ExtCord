import { MessagePhrase } from "../../language/phrase/MessagePhrase";
import { StringArgument } from "../arguments/StringArgument";
import { UserArgument } from "../arguments/UserArgument";
import { CommandGroup } from "../CommandGroup";
import { SimpleCommand } from "../SimpleCommand";

const botReloadPhrase = new MessagePhrase(
    {
        description: "Shown when the bot is reloaded",
        name: "botReload",
    },
    "Reload completed.",
    {
        description: "The bot has been reloaded.",
        timestamp: false,
        title: "Reload completed",
    },
    {},
);

const botSendPhrase = new MessagePhrase(
    {
        description: "Shown when a message is sent as the bot",
        name: "botSend",
    },
    "Message sent.",
    {
        description: "The message has been sent to {user}.",
        timestamp: false,
        title: "Message sent",
    },
    {
        user: "The user the message was sent to",
    },
);

const botReloadCommand = new SimpleCommand(
    {
        allowedPrivileges: ["host"],
        author: "extcord",
        description: "Reload the bot",
        name: "reload",
    },
    [] as const,
    async (context) => {
        await context.bot.reload();
        await context.respond(botReloadPhrase, {});
    },
);

const botSendCommand = new SimpleCommand(
    {
        allowedPrivileges: ["host"],
        author: "extcord",
        description: "Send a message as the bot",
        name: "send",
    },
    [
        new UserArgument(
            {
                description: "the recipient of the message",
                name: "recipient",
            },
            false,
        ),
        new StringArgument(
            {
                description: "the message to send",
                name: "message",
            },
            false,
            true,
        ),
    ] as const,
    async (context) => {
        const [recipientPromise, message] = context.arguments;
        const recipient = await recipientPromise;
        await recipient.user.send(message);
        await context.respond(botSendPhrase, { user: recipient.user.toString() });
    },
);

export const botCommand = new CommandGroup(
    {
        allowedPrivileges: ["host"],
        author: "extcord",
        description: "Control the bot",
        name: "bot",
    },
);

botCommand.addSubcommands(botReloadCommand, botSendCommand);
botCommand.addPhrases(botReloadPhrase, botSendPhrase);
