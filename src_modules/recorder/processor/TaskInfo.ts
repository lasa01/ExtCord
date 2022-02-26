import { AsyncResource } from "async_hooks";
import { IVoicePackets } from "../GuildRecorder";

export class TaskInfo extends AsyncResource {
    constructor(private callback: TaskCallback) {
        super("TaskInfo");
    }

    public done(err?: any, result?: Buffer) {
        this.runInAsyncScope(this.callback, null, err, result);
        this.emitDestroy();
    }
}

export type TaskCallback = (err: any, result: Buffer) => void;

export interface ITask {
    startMillis: number,
    seconds: number,
    buffers: IVoicePackets[][],
};
