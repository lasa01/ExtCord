import Sequelize from "sequelize";
import Database from "./database";

export default class DatabaseRow {
    private id: string;
    private instance?: Sequelize.Instance<{[key: string]: object}>;

    constructor(parent: {[key: string]: any}) {
        if (parent.id) { this.id = parent.id; } else { throw new Error(); }
    }

    public async get(name: string) {
        if (this.instance) {
            return await this.instance.get(name);
        }
    }
}
