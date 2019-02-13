export default class Language {
    public id: string; // ISO 639-1
    public name: string;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }

    public async load(data: object) { return; }
}
