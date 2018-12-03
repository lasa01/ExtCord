import Sequelize from "sequelize";
import Winston from "winston";
import DatabaseRowWrapper from "./rowwrapper";

export default class Database {
    private logger: Winston.Logger;
    private database: Map<string|object, {
        string: Map<string, string>,
        number: Map<string, number>,
        boolean: Map<string, boolean>,
    }>;
    private sequelize?: Sequelize.Sequelize;
    private template: {
        boolean: Array<IDatabaseTemplateEntry<boolean>>;
        number: Array<IDatabaseTemplateEntry<number>>;
        string: Array<IDatabaseTemplateEntry<string>>;
    };

    constructor(logger: Winston.Logger) {
        this.logger = logger;
        this.database = new Map();
        this.template = {
            boolean: [],
            number: [],
            string: [],
        };
    }

    public async connect(info: IDatabaseInfo) {
        this.sequelize = new Sequelize(info.database, info.username, info.password, {
            dialect: info.dialect,
            host: info.host,
            logging: (log: string) => this.logger.debug(log),
            operatorsAliases: false,
            port: info.port,
            storage: info.sqlite_storage,
        });
        for (const entry of this.template.string) {
            let databaseEntry = this.database.get(entry.target);
            if (!databaseEntry) {
                databaseEntry = {
                    boolean: new Map(),
                    number: new Map(),
                    string: new Map(),
                };
                this.database.set(entry.target, databaseEntry);
            }
        }
        /*7
        let x = this.sequelize.define("test", {
            name: {
                type: Sequelize.STRING,
            },
            value: {
                type: Sequelize.BOOLEAN,
            },
        });

        let xs = await x.findAll();

        let a = Database;
        /*/
    }

    public registerRow(target: {new(...args: any[]): any}) {
        Object.assign(target, DatabaseRowWrapper);
    }

    /*/
    public getString(from: string|object, name: string): string {
        const target = this.database.get(from);
        if (target) {
            const value = target.string.get(name);
            if (value) {
                return value;
            } else {
                throw new Error(`Target ${target} has no database entry named ${name}`);
            }
        } else {
            throw new Error(`Target ${target} does not exist`);
        }
    }

    public getNumber(from: string|object, name: string): number {
        const target = this.database.get(from);
        if (target) {
            const value = target.number.get(name);
            if (value) {
                return value;
            } else {
                throw new Error(`Target ${target} has no database entry named ${name}`);
            }
        } else {
            throw new Error(`Target ${target} does not exist`);
        }
    }

    public getBoolean(from: string|object, name: string): boolean {
        const target = this.database.get(from);
        if (target) {
            const value = target.boolean.get(name);
            if (value) {
                return value;
            } else {
                throw new Error(`Target ${target} has no database entry named ${name}`);
            }
        } else {
            throw new Error(`Target ${target} does not exist`);
        }
    }

    public registerString(to: string|object, name: string, defaultValue?: string) {
        this.template.string.push({
            defaultValue,
            name,
            target: to,
        });
    }

    public registerNumber(to: string|object, name: string, defaultValue?: number) {
        this.template.number.push({
            defaultValue,
            name,
            target: to,
        });
    }

    public registerBoolean(to: string|object, name: string, defaultValue?: boolean) {
        this.template.boolean.push({
            defaultValue,
            name,
            target: to,
        });
    }
    /*/

}

export function databased(object: object): object is DatabaseRowWrapper {
    if ((object as DatabaseRowWrapper).database) {
        return true;
    } else {
        return false;
    }
}

interface IDatabaseTemplateEntry<T> {
    target: string|object;
    name: string;
    defaultValue?: T;
}

interface IDatabaseInfo {
    database: string;
    username: string;
    password: string;
    dialect: string;
    host: string;
    port: number;
    sqlite_storage?: string;
}
