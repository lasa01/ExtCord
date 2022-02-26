import { EventEmitter } from "events";
import path from "path";
import { Worker } from "worker_threads";

import { ITask, TaskCallback, TaskInfo } from "./TaskInfo";

const kTaskInfo = Symbol("kTaskInfo");
const kWorkerFreedEvent = Symbol("kWorkerFreedEvent");

export class Processor extends EventEmitter {
    private worker: Worker & { [kTaskInfo]?: TaskInfo };
    private tasks: {
        task: ITask,
        callback: TaskCallback,
    }[];

    constructor() {
        super();

        this.worker = this.createWorker();

        this.tasks = [];
    }

    public async runTask(task: ITask): Promise<Buffer> {
        const taskInfo = this.worker[kTaskInfo];

        return new Promise((resolve, reject) => {
            const callback: TaskCallback = (err, result) => {
                if (result !== undefined) {
                    resolve(result);
                } else {
                    reject(err);
                }
            };

            if (taskInfo !== undefined) {
                // Worker is busy
                this.tasks.push({ task, callback });
            }

            this.worker[kTaskInfo] = new TaskInfo(callback);
            this.worker.postMessage(task);
        });
    }

    public close() {
        this.worker.terminate();
    }

    private createWorker(): Worker {
        const worker = Object.assign(new Worker(path.resolve(__dirname, "worker.js")), { [kTaskInfo]: undefined });

        worker.on("message", (result) => {
            const taskInfo = this.worker[kTaskInfo];

            if (taskInfo !== undefined) {
                taskInfo.done(undefined, result);
                this.worker[kTaskInfo] = undefined;
            }

            this.emit(kWorkerFreedEvent);
        });

        worker.on("error", (err) => {
            const taskInfo = this.worker[kTaskInfo];

            if (taskInfo !== undefined) {
                taskInfo.done(err.message, undefined);
            }

            this.worker = this.createWorker();
            this.emit(kWorkerFreedEvent);
        });

        return worker;
    }
}
