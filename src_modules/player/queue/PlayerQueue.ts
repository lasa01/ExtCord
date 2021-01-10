import { IExtendedGuild } from "../../../dist";
import { PlayerQueueItem } from "./PlayerQueueItem";

export class PlayerQueue {
    public guild: IExtendedGuild;
    public playing?: PlayerQueueItem;
    public readonly queue: PlayerQueueItem[];

    public constructor(guild: IExtendedGuild) {
        this.guild = guild;
        this.queue = [];
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
}
