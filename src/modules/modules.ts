import Module from "./module";

export default class Modules {
    modules: Map<string, Module>;

    constructor() {
        this.modules = new Map();
    }
}