import { Command, IExecutionContext } from "../../..";
import VoiceCommandsModule from "..";
import { autoJoinEnabledPhrase, autoJoinAlreadyEnabledPhrase } from "../phrases";

export class EnableAutoJoinCommand extends Command<[]> {
    private voiceCommandsModule: VoiceCommandsModule;

    public constructor(voiceCommandsModule: VoiceCommandsModule) {
        super(
            {
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Enable automatic joining",
                globalAliases: ["enableautojoin"],
                name: "enableautojoin",
            },
            [],
        );

        this.voiceCommandsModule = voiceCommandsModule;
    }

    public async execute(context: IExecutionContext<[]>) {
        const guild = context.guild.guild;

        if (await this.voiceCommandsModule.autoJoinConfigEntry.guildGet(guild)) {
            return context.respond(autoJoinAlreadyEnabledPhrase, {});
        }

        await this.voiceCommandsModule.autoJoinConfigEntry.guildSet(guild, true);
        return context.respond(autoJoinEnabledPhrase, {});
    }
}
