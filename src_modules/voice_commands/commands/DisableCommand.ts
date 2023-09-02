import { Command, IExecutionContext } from "../../..";
import VoiceCommandsModule from "..";
import { voiceCommandsDisabledPhrase, voiceCommandsAlreadyDisabledPhrase } from "../phrases";

export class DisableCommand extends Command<[]> {
    private voiceCommandsModule: VoiceCommandsModule;

    public constructor(voiceCommandsModule: VoiceCommandsModule) {
        super(
            {
                allowedPrivileges: ["admin"],
                author: "extcord",
                description: "Disable voice commands",
                globalAliases: [],
                name: "disable",
            },
            [],
        );

        this.voiceCommandsModule = voiceCommandsModule;
    }

    public async execute(context: IExecutionContext<[]>) {
        const guild = context.guild;

        if (await this.voiceCommandsModule.voiceCommandsEnabledConfigEntry.guildGet(guild)) {
            await this.voiceCommandsModule.voiceCommandsEnabledConfigEntry.guildSet(guild, false);
            return context.respond(voiceCommandsDisabledPhrase, {});
        } else {
            return context.respond(voiceCommandsAlreadyDisabledPhrase, {});
        }
    }
}
