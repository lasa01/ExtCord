export default class Module {
    author: string;
    name: string;

    protected constructor(author: string, name: string) {
        this.author = author;
        this.name = name;
    }
}