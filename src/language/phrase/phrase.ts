export abstract class Phrase {
    public name: string;
    public description?: string;

    constructor(info: IPhraseInfo) {
        this.name = info.name;
        this.description = info.description;
    }

    public abstract parse(language: string, data: any): [any, string?];
}

export interface IPhraseInfo {
    name: string;
    description?: string;
}
