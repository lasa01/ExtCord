import { Command, CommandContext } from '../../../src/commands/command';
import PlayerModule from '../index';

export class ShuffleCommand extends Command {
  constructor() {
    super({
      name: 'shuffle',
      description: 'Shuffle the player queue',
      module: 'player',
    });
  }

  async execute(ctx: CommandContext) {
    const player = await PlayerModule.get(ctx.bot, ctx.msg);
    if (!player) return;

    player.queue.shuffle();
    await ctx.ok('player.shuffle.success');
  }
}