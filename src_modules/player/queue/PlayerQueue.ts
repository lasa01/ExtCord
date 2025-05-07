import { IExtendedGuild } from "../../../dist";
import { PlayerQueueItem } from "./PlayerQueueItem";

export class PlayerQueue {
    public guild: IExtendedGuild;
    public playing?: PlayerQueueItem;
    public readonly queue: PlayerQueueItem[];
    public repeat: boolean;

    public constructor(guild: IExtendedGuild) {
        this.guild = guild;
        this.queue = [];
        this.repeat = false;
    }

    public enqueue(item: PlayerQueueItem) {
        this.queue.push(item);
    }

    public dequeue() {
        return this.queue.shift();
    }

    public clear() {
        this.queue.length = 0;
    }

    public pop(): PlayerQueueItem | undefined {
        return this.queue.pop();
    }

    public shuffle() {
        for (let i = this.queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
        }
    }

    public toggleRepeat(): boolean {
        this.repeat = !this.repeat;
        return this.repeat;
    }
}
