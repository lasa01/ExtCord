export default class Argument {
    public name: string;
    public description: string;
    public optional: boolean;

    constructor(info: IArgumentInfo, optional = false) {
        this.name = info.name;
        this.description = info.description;
        this.optional = optional;
    }

    public check(data: string) { return false; }

    public parse(data: string): any { return; }
}

export interface IArgumentInfo {
    name: string;
    description: string;
}
