export default class BasePhrase {
    public name: string;
    public description: string;

    constructor(info: IPhraseInfo) {
        this.name = info.name;
        this.description = info.description;

    }

    public parse(language: string, data: any): [any, string] {
        return [data, ""];
    }
}

export interface IPhraseInfo {
    name: string;
    description: string;
}
