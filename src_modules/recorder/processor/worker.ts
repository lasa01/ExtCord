import { Readable } from "stream";
import { parentPort } from "worker_threads";

import prism = require("prism-media");

import { ITask } from "./TaskInfo";

const samplesPerMillis = 2 * 48000 / 1000;

parentPort!.on("message", async (task: ITask) => {
    const outputBuf = Buffer.alloc(task.seconds * 1000 * samplesPerMillis * 2);

    const startMillis = task.startMillis;
    const maxSamples = task.buffers.length;

    for (const buffers of task.buffers) {
        for (const packets of buffers) {
            const stream = Readable.from(packets.packets);
            const rawAudio = stream.pipe(new prism.opus.Decoder({ frameSize: 960, channels: 2, rate: 48000 }));
            const audioBuf = await streamToBuffer(rawAudio);

            const srcOffsetMillis = packets.startMillis < startMillis ? startMillis - packets.startMillis : 0;
            const srcOffset = srcOffsetMillis * samplesPerMillis;

            const dstOffsetMillis = packets.startMillis > startMillis ? packets.startMillis - startMillis : 0;
            const dstOffset = dstOffsetMillis * samplesPerMillis;

            const n = Math.min(audioBuf.length / 2 - srcOffset, outputBuf.length / 2 - dstOffset);

            for (let i = 0; i < n; i++) {
                const outI = 2 * (i + dstOffset);
                outputBuf.writeInt16LE(outputBuf.readInt16LE(outI) + audioBuf.readInt16LE(2 * (i + srcOffset)) / maxSamples, outI);
            }
        }
    }

    parentPort!.postMessage(outputBuf);
});

async function streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const buf: any[] = [];

        stream.on("data", (chunk) => buf.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(buf)));
        stream.on("error", reject);
    });
}
