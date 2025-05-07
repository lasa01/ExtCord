import { Bot, Command, ICommandContext, IExecutionContext } from "../../..";
import PlayerModule from "..";
import { musicNotPlayingPhrase, musicRepeatEnabledPhrase, musicRepeatDisabledPhrase } from "../phrases";

export class RepeatCommand extends Command<[]> {
    private player: PlayerModule;

    public constructor(player: PlayerModule) {
        super(
            {
                aliases: ["r"],
                allowedPrivileges: ["everyone"],
                author: "extcord",
                description: "Toggle repeat mode",
                globalAliases: ["repeat", "r"],
                name: "repeat",
                voiceCommand: true,
            },
            [],
        );
        this.player = player;
    }

    public async execute(context: IExecutionContext<[]>) {
        const queue = this.player.getQueue(context.guild);

        if (!queue.playing) {
            return context.respond(musicNotPlayingPhrase, {});
        }

        const isRepeat = queue.toggleRepeat();
        return context.respond(isRepeat ? musicRepeatEnabledPhrase : musicRepeatDisabledPhrase, {});
    }
} 