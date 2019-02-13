import Winston from "winston";

import AsyncFS from "../util/asyncfs";
import Language from "./language";

export default class Languages {
    private logger: Winston.Logger;
    private languages: Map<string, Language>;

    constructor(logger: Winston.Logger) {
        this.logger = logger;
        this.languages = new Map();
    }

    // No
    public register(language: Language) {
        this.logger.debug(`Registering language ${language.name}`);
        this.languages.set(language.id, language);
    }

    public async loadAll(directory: string) {
        this.logger.info("Loading all modules");
        const content = await AsyncFS.readdir(directory);
        for (const file of content) {
            // Skip files that aren't json
            if (!file.endsWith(".json")) { continue; }
        }
    }
}
