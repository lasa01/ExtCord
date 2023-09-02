import { Command, IExecutionContext } from "../../..";
import VoiceCommandsModule from "..";
import { autoJoinDisabledPhrase, autoJoinAlreadyDisabledPhrase } from "../phrases";

export class DisableAutoJoinCommand extends Command<[]> {
    private voiceCommandsModule: VoiceCommandsModule;

    public constructor(voiceCommandsModule: VoiceCommandsModule) {
        super(
            {
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Disable automatic joining",
                globalAliases: ["disableautojoin"],
                name: "disableautojoin",
            },
            [],
        );

        this.voiceCommandsModule = voiceCommandsModule;
    }

    public async execute(context: IExecutionContext<[]>) {
        const guild = context.guild;
    
        if (await this.voiceCommandsModule.autoJoinConfigEntry.guildGet(guild)) {
            await this.voiceCommandsModule.autoJoinConfigEntry.guildSet(guild, false);
            return context.respond(autoJoinDisabledPhrase, {});
        } else {
            return context.respond(autoJoinAlreadyDisabledPhrase, {});
        }
    }
}
