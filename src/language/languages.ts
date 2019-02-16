import Hjson from "hjson";
import Winston from "winston";

import AsyncFS from "../util/asyncfs";
import Language from "./language";
import Phrase from "./phrase/phrase";

export default class Languages {
    private logger: Winston.Logger;
    private languages: Map<string, Language>;
    private phrases: Map<string, Phrase>;

    constructor(logger: Winston.Logger) {
        this.logger = logger;
        this.languages = new Map();
        this.phrases = new Map();
    }

    public async loadAll(directory: string) {
        this.logger.info("Loading all modules");
        const dirContent = await AsyncFS.readdir(directory);
        for (const fileName of dirContent) {
            // Skip files that aren't hjson
            if (!fileName.endsWith(".hjson")) { continue; }
            let content: string;
            let parsed: any;
            try {
                content = await AsyncFS.readFile(fileName, "utf8");
                parsed = Hjson.parse(content, { keepWsc: true });
            } catch {
                content = "";
                parsed = {};
            }
        }
    }
}
