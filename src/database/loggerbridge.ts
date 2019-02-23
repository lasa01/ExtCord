import { Logger } from "typeorm";
import { Logger as WinstonLogger } from "winston";

export class LoggerBridge implements Logger {
    private logger: WinstonLogger;

    constructor(logger: WinstonLogger) {
        this.logger = logger;
    }

    public logQuery(query: string) {
        this.logger.verbose(`Querying: ${query}`);
    }

    public logQueryError(error: string) {
        this.logger.error(error);
    }

    public logQuerySlow(time: number) {
        this.logger.warn(`Sloq query: ${time}`);
    }

    public logSchemaBuild(message: string) {
        this.logger.info(`Building schema: ${message}`);
    }

    public logMigration(message: string) {
        this.logger.info(`Migrating: ${message}`);
    }

    public log(level: string, message: any) {
        this.logger.log(level, message);
    }
}
