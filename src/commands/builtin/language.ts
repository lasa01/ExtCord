import { DynamicFieldMessagePhrase } from "../../language/phrase/DynamicFieldMessagePhrase";
import { MessagePhrase } from "../../language/phrase/MessagePhrase";
import { TemplatePhrase } from "../../language/phrase/TemplatePhrase";
import { StringArgument } from "../arguments/StringArgument";
import { CommandGroup } from "../CommandGroup";
import { SimpleCommand } from "../SimpleCommand";

const languageInvalidPhrase = new TemplatePhrase(
    {
        description: "Shown when the supplied language is invalid",
        name: "languageInvalid",
    },
    "The language `{language}` doesn't exist.\nView available languages with `{cmd}`.",
    {
        cmd: "The command that shows available languages",
        language: "The invalid language",
    },
);

const languageSetPhrase = new MessagePhrase(
    {
        description: "Shown when the language is updated",
        name: "languageSet",
    },
    "The language has been successfully set to `{language}`.",
    {
        description: "The language has been successfully set to `{language}`.",
        timestamp: false,
        title: "Language updated",
    },
    {
        language: "the new language",
    });

const languageShowPhrase = new MessagePhrase(
    {
        description: "Shown when the language is shown",
        name: "languageShow",
    },
    "The current language is `{language}`.",
    {
        timestamp: false,
        title: "The current language is `{language}`.",
    },
    {
        language: "the current language",
    },
);

const languageListPhrase = new DynamicFieldMessagePhrase(
    {
        description: "Shown when the available languages are listed",
        name: "languageList",
    },
    "There are {n} available languages.",
    {
        description: "There are {n} available languages.",
        timestamp: false,
        title: "Available languages",
    },
    "{name}: `{cmd}`",
    {
        inline: true,
        name: "{name}:",
        value: "`{cmd}`",
    },
    {
        n: "The amount of available languages",
    },
    {
        cmd: "The command to set the language",
        name: "The name of the language",
    },
);

const languageSetCommand = new SimpleCommand(
    {
        author: "extcord",
        description: "Set the language",
        name: "set",
    },
    [
        new StringArgument(
            {
                description: "The new language",
                name: "language",
            },
            false,
            false,
            async (data, context, error) => {
                if (!context.bot.languages.languages.includes(data)) {
                    return error(languageInvalidPhrase, {
                        cmd: languageListCommand.getUsageName(context.language),
                        language: data,
                    });
                }
                return false;
            },
        ),
    ] as const,
    async (context) => {
        const language = context.arguments[0];
        if (context.language !== language) {
            await context.bot.languages.languageConfigEntry!.guildSet(context.message.guild, language);
        }
        await context.respond(languageSetPhrase, { language });
    },
    false,
    ["admin"],
);

const languageShowCommand = new SimpleCommand(
    {
        aliases: ["s"],
        author: "extcord",
        description: "Show the language",
        name: "show",
    },
    [] as const,
    async (context) => context.respond(languageShowPhrase, { language: context.language }),
    true,
);

const languageListCommand: SimpleCommand<[]> = new SimpleCommand(
    {
        aliases: ["l"],
        author: "extcord",
        description: "List the available language",
        name: "list",
    },
    [],
    async (context) => context.respond(
        languageListPhrase,
        { n: context.bot.languages.languages.length.toString() },
        context.bot.languages.languages.map((lang) => ({
            cmd: languageSetCommand.getUsageName(context.language) + " " + lang,
            name: context.bot.languages.languageNames[lang],
        })),
    ),
    true,
);

export const languageCommand = new CommandGroup(
    {
        aliases: ["lang"],
        author: "extcord",
        description: "show or update the language",
        name: "language",
    },
);

languageCommand.addSubcommands(languageSetCommand, languageShowCommand, languageListCommand);
languageCommand.addPhrases(languageInvalidPhrase, languageSetPhrase, languageShowPhrase, languageListPhrase);
