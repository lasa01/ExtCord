import { createLogger, format, Logger as WinstonLogger, transports } from "winston";

export const LogLevels: { [key: number]: string|undefined } = {
    0: "error",
    1: "warn",
    2: "info",
    3: "verbose",
    4: "debug",
    5: "silly",
};

export type LogLevel = "error"|"warn"|"info"|"verbose"|"debug"|"silly";

let loggerInstance: WinstonLogger|undefined;

export const logger = {
    get() {
        if (loggerInstance) {
            return loggerInstance;
        } else {
            throw new Error("Logger is not initialized");
        }
    },
    initialize(verbose: number) {
        loggerInstance = createLogger({
            format: format.combine(format.timestamp({
                format: "YYYY-MM-DD HH:mm:ss",
            }), format.printf((info) => `[${info.timestamp}] [${info.level}]: ${info.message}`)),
            level: LogLevels[2 + verbose] || "silly",
            transports: [
                new transports.Console(),
            ],
        });
    },
    log(level: LogLevel, message: string) {
        if (loggerInstance) {
            loggerInstance.log(level, message);
        } else {
            throw new Error("Logger is not initialized");
        }
    },
    debug: (message: string) => logger.log("debug", message),
    error: (message: string) => logger.log("error", message),
    info: (message: string) => logger.log("info", message),
    silly: (message: string) => logger.log("silly", message),
    verbose: (message: string) => logger.log("verbose", message),
    warn: (message: string) => logger.log("warn", message),
};
