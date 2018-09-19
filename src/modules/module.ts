export default class Module {
    public author: string;
    public name: string;

    protected constructor(author: string, name: string) {
        this.author = author;
        this.name = name;
    }
}
