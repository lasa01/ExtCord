import { Command, IExecutionContext } from "../../..";
import VoiceCommandsModule from "..";
import { autoJoinEnabledPhrase, autoJoinAlreadyEnabledPhrase } from "../phrases";

export class EnableAutoJoinCommand extends Command<[]> {
    private voiceCommandsModule: VoiceCommandsModule;

    public constructor(voiceCommandsModule: VoiceCommandsModule) {
        super(
            {
                allowedPrivileges: ["admin"],
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
        const guild = context.guild;

        if (await this.voiceCommandsModule.autoJoinEnabledConfigEntry.guildGet(guild)) {
            return context.respond(autoJoinAlreadyEnabledPhrase, {});
        }

        await this.voiceCommandsModule.autoJoinEnabledConfigEntry.guildSet(guild, true);
        return context.respond(autoJoinEnabledPhrase, {});
    }
}
