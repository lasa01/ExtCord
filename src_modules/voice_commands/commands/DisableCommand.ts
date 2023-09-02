import { Command, IExecutionContext } from "../../..";
import VoiceCommandsModule from "..";
import { voiceCommandsDisabledPhrase, voiceCommandsAlreadyDisabledPhrase } from "../phrases";

export class DisableCommand extends Command<[]> {
    private voiceCommandsModule: VoiceCommandsModule;

    public constructor(voiceCommandsModule: VoiceCommandsModule) {
        super(
            {
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Disable voice commands",
                globalAliases: ["disable"],
                name: "disable",
            },
            [],
        );

        this.voiceCommandsModule = voiceCommandsModule;
    }

    public async execute(context: IExecutionContext<[]>) {
        const guild = context.guild.guild;

        if (await this.voiceCommandsModule.voiceCommandsEnabledConfigEntry.guildGet(guild)) {
            await this.voiceCommandsModule.voiceCommandsEnabledConfigEntry.guildSet(guild, false);
            return context.respond(voiceCommandsDisabledPhrase, {});
        } else {
            return context.respond(voiceCommandsAlreadyDisabledPhrase, {});
        }
    }
}
