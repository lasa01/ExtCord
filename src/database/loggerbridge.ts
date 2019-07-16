import { Logger } from "typeorm";
import { logger as extcordLogger } from "../util/logger";

export class LoggerBridge implements Logger {
    private logger: typeof extcordLogger;

    constructor(logger: typeof extcordLogger) {
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
