import { Readable } from "stream";
import ytdl = require("ytdl-core");

export interface IQueueItemDetails {
    author: string;
    authorIconUrl: string;
    authorUrl: string;
    duration: string;
    thumbnailUrl: string;
    title: string;
    url: string;
}

export class PlayerQueueItem {
    public readonly details: IQueueItemDetails;
    public readonly url: string;
    private ytdlResult?: Readable;

    public constructor(details: IQueueItemDetails, ytdlResult?: Readable) {
        this.details = details;
        this.url = details.url;
        this.ytdlResult = ytdlResult;
    }

    public async getStream(): Promise<Readable> {
        return this.ytdlResult ?? ytdl(this.url, { filter: "audioonly" });
    }
}
