import { Command, IExecutionContext } from "extcord";
import VoiceCommandsModule from "..";
import { voiceCommandsEnabledErrorPhrase, voiceCommandsEnabledPhrase } from "../phrases";

export class EnableCommand extends Command<[]> {
    private voiceCommandsModule: VoiceCommandsModule;

    public constructor(voiceCommandsModule: VoiceCommandsModule) {
        super(
            {
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Enable voice commands",
                globalAliases: ["enable"],
                name: "enable",
            },
            [],
        );

        this.voiceCommandsModule = voiceCommandsModule;
    }

    public async execute(context: IExecutionContext<[]>) {
        const guild = context.guild.guild;

        if (await this.voiceCommandsModule.voiceCommandsEnabledConfigEntry.guildGet(guild)) {
            return context.respond(voiceCommandsEnabledErrorPhrase, {});
        }

        await this.voiceCommandsModule.voiceCommandsEnabledConfigEntry.guildSet(guild, true);
        return context.respond(voiceCommandsEnabledPhrase, {});
    }
}