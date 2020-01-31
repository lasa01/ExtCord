import { createLogger, format, Logger as WinstonLogger, transports } from "winston";

/**
 * An object mapping log level integers into log level names.
 * @category Util
 */
export const LogLevels: { [key: number]: string|undefined } = {
    0: "error",
    1: "warn",
    2: "info",
    3: "verbose",
    4: "debug",
    5: "silly",
};

/**
 * A type of posibble log level names.
 * @category Util
 */
export type LogLevel = "error"|"warn"|"info"|"verbose"|"debug"|"silly";

let loggerInstance: WinstonLogger|undefined;

/**
 * The logger of the bot.
 * @category Util
 */
export const Logger = {
    /** Gets the underlying logger instance. */
    get() {
        if (loggerInstance) {
            return loggerInstance;
        } else {
            throw new Error("Logger is not initialized");
        }
    },
    /**
     * Initializes the logger.
     * @param verbose The amount of verbosity for the logger. Should be in range [-2, 3].
     */
    initialize(verbose: number) {
        loggerInstance = createLogger({
            format: format.combine(format.timestamp({
                format: "YYYY-MM-DD HH:mm:ss",
            }), format.printf((info) => `[${info.timestamp}] [${info.level}]: ${info.message}`)),
            level: LogLevels[2 + verbose] ?? "silly",
            transports: [
                new transports.Console(),
            ],
        });
    },
    /**
     * Logs a message with a specified level.
     * @param level The log level to use.
     * @param message The message to log.
     */
    log(level: LogLevel, message: string) {
        if (loggerInstance) {
            const lines = message.split("\n");
            for (const line of lines) {
                loggerInstance!.log(level, line);
            }
        } else {
            throw new Error("Logger is not initialized");
        }
    },
    /** Logs a debug message. */
    debug: (message: string) => Logger.log("debug", message),
    /** Logs an error message. */
    error: (message: string) => Logger.log("error", message),
    /** Logs an informative message. */
    info: (message: string) => Logger.log("info", message),
    /** Logs a silly message. */
    silly: (message: string) => Logger.log("silly", message),
    /** Logs a verbose message. */
    verbose: (message: string) => Logger.log("verbose", message),
    /** Logs a warning message. */
    warn: (message: string) => Logger.log("warn", message),
};
