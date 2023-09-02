import { Command, IExecutionContext } from "../../..";
import VoiceCommandsModule from "..";
import { voiceCommandsAlreadyEnabledPhrase, voiceCommandsEnabledPhrase, voiceCommandsNotSupportedPhrase } from "../phrases";

export class EnableCommand extends Command<[]> {
    private voiceCommandsModule: VoiceCommandsModule;

    public constructor(voiceCommandsModule: VoiceCommandsModule) {
        super(
            {
                allowedPrivileges: ["admin"],
                author: "extcord",
                description: "Enable voice commands",
                globalAliases: [],
                name: "enable",
            },
            [],
        );

        this.voiceCommandsModule = voiceCommandsModule;
    }

    public async execute(context: IExecutionContext<[]>) {
        const guild = context.guild;

        if (await this.voiceCommandsModule.voiceCommandsEnabledConfigEntry.guildGet(guild)) {
            return context.respond(voiceCommandsAlreadyEnabledPhrase, {});
        }

        const backendLanguage = this.voiceCommandsModule.backendLanguageIdPhrase.get(context.language);

        if (backendLanguage === undefined || backendLanguage === "") {
            return context.respond(voiceCommandsNotSupportedPhrase, {});;
        }

        await this.voiceCommandsModule.voiceCommandsEnabledConfigEntry.guildSet(guild, true);
        return context.respond(voiceCommandsEnabledPhrase, {});
    }
}
