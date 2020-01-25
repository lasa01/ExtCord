import { Logger } from "typeorm";
import { Logger as ExtcordLogger } from "../util/Logger";

/**
 * A bridge between the bot's logger and the database.
 * @category Database
 */
export class LoggerBridge implements Logger {
    private logger: typeof ExtcordLogger;

    constructor(logger: typeof ExtcordLogger) {
        this.logger = logger;
    }

    public logQuery(query: string) {
        this.logger.debug(`Database querying: ${query}`);
    }

    public logQueryError(error: string) {
        this.logger.error(error);
    }

    public logQuerySlow(time: number) {
        this.logger.warn(`Database slow query: ${time}`);
    }

    public logSchemaBuild(message: string) {
        this.logger.verbose(`Database building schema: ${message}`);
    }

    public logMigration(message: string) {
        this.logger.verbose(`Database migrating: ${message}`);
    }

    public log(level: "info"|"warn", message: any) {
        this.logger.log(level, message);
    }
}
