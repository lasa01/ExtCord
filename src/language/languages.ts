import Winston from "winston";

import Language from "./language";

export default class Languages {
    private logger: Winston.Logger;
    private languages: Map<string, Language>;

    constructor(logger: Winston.Logger) {
        this.logger = logger;
        this.languages = new Map();
    }

    public register(language: Language) {
        this.logger.debug(`Registering language ${language.name}`);
        this.languages.set(language.id, language);
    }

    public async loadAll(fileName: string) { return; }
}
