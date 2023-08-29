import { Agent as HttpsAgent } from "https";
import { Agent as HttpAgent } from "http";
import fetch from "node-fetch";
import { Readable } from "stream";

import VoiceCommandsModule from ".";

export class VoiceBackendClient {
    private module: VoiceCommandsModule;
    private agent?: HttpAgent;

    constructor(module: VoiceCommandsModule) {
        this.module = module;
    }

    public async fetchPhonetic(plain: string, language: string): Promise<string> {
        plain = encodeURIComponent(plain);
        language = encodeURIComponent(this.getLanguageBackendId(language));

        const url = this.module.urlConfigEntry.get();

        const requestUrl = `${url}/phonetics/${language}?text=${plain}`;

        const response = await fetch(requestUrl, {
            headers: this.getHeaders(),
            agent: this.getAgent(url),
        });

        if (!response.ok) {
            throw new Error(`Voice backend request to ${requestUrl} failed: ${response.status} ${response.statusText}`);
        }

        return response.text();
    }

    public async fetchSpeech(text: string, language: string): Promise<ArrayBuffer> {
        text = encodeURIComponent(text);
        language = encodeURIComponent(this.getLanguageBackendId(language));

        const url = this.module.urlConfigEntry.get();

        const requestUrl = `${url}/tts/${language}?text=${text}`;

        const response = await fetch(requestUrl, {
            headers: this.getHeaders(),
            agent: this.getAgent(url),
        });

        if (!response.ok) {
            throw new Error(`Voice backend request to ${requestUrl} failed: ${response.status} ${response.statusText}`);
        }

        return response.arrayBuffer();
    }

    public async fetchAsr(encodedOpusPackets: Buffer, language: string): Promise<IAsrResult> {
        language = encodeURIComponent(this.getLanguageBackendId(language));

        const url = this.module.urlConfigEntry.get();

        const requestUrl = `${url}/asr/${language}`;

        const bodyStream = new Readable({
            read() {
                this.push(encodedOpusPackets);
                this.push(null);
            }
        });

        const response = await fetch(requestUrl, {
            method: "POST",
            headers: {
                ...this.getHeaders(),
                "Content-Type": "application/extcord-opus-packets",
                "Content-Length": encodedOpusPackets.length.toString(),
            },
            body: bodyStream,
            agent: this.getAgent(url),
        });

        if (!response.ok) {
            throw new Error(`Voice backend request to ${requestUrl} failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    private getLanguageBackendId(extcordLanguage: string): string {
        return this.module.backendLanguageIdPhrase.get(extcordLanguage);
    }

    private getAgent(url: string): HttpAgent {
        if (this.agent !== undefined) {
            return this.agent;
        }

        const urlObject = new URL(url);

        if (urlObject.protocol === "https:") {
            this.agent = new HttpsAgent({
                keepAlive: true
            });
        } else {
            this.agent = new HttpAgent({
                keepAlive: true
            });
        }

        return this.agent;
    }

    private getHeaders() {
        return {
            "Authorization": this.module.tokenConfigEntry.get(),
        };
    }
}

export interface IAsrResult {
    text: string;
    text_phonetic: string;
}
