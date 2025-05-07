import { AudioResource, createAudioResource } from "@discordjs/voice";
import { Readable } from "stream";
import ytdl = require("@nuclearplayer/ytdl-core");
import fetch from "node-fetch";

export interface IQueueItemDetails {
    author: string;
    authorIconUrl: string;
    authorUrl: string;
    duration: string;
    thumbnailUrl: string;
    title: string;
    url: string;
    urlIsYoutube: boolean,
}

export class PlayerQueueItem {
    public readonly details: IQueueItemDetails;
    public readonly url: string;
    private ytdlResult?: Readable;
    private resource?: AudioResource;

    public constructor(details: IQueueItemDetails, ytdlResult?: Readable) {
        this.details = details;
        this.url = details.url;
        this.ytdlResult = ytdlResult;
    }

    public async getResource(): Promise<AudioResource> {
        if (this.resource) {
            return this.resource;
        }

        const stream = await this.getStream();
        this.resource = createAudioResource(stream, { inlineVolume: true });
        return this.resource;
    }

    private async getStream(): Promise<Readable> {
        if (this.ytdlResult) {
            return this.ytdlResult;
        }

        if (this.details.urlIsYoutube) {
            return ytdl(this.url, {
                filter: "audioonly",
                highWaterMark: 1 << 62,
                liveBuffer: 1 << 62,
                dlChunkSize: 0,
            });
        }

        // fetch url directly
        const response = await fetch(this.url);

        if (!response.ok) {
            throw new Error(`Request to '${this.url}' failed: ${response.status} ${response.statusText}`);
        }

        if (response.body == null) {
            throw new Error(`Request to '${this.url}' failed: no body`);
        }

        return response.body as unknown as Readable;
    }
}
