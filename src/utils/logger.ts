/**
 * Log levels supported by the logger
 */
export enum LogLevel {
    NONE = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4
}

/**
 * Logger configuration options
 */
export interface LoggerOptions {
    level: LogLevel;
    prefix?: string;
    customLogger?: Partial<Logger>;
}

/**
 * Logger interface for consistent logging
 */
export interface Logger {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}

/**
 * Default logger implementation
 */
class DefaultLogger implements Logger {
    private level: LogLevel = LogLevel.INFO;
    private prefix: string = '[BTPay]';

    constructor(options?: LoggerOptions) {
        if (options) {
            this.level = options.level;
            if (options.prefix) {
                this.prefix = options.prefix;
            }
        }
    }

    debug(message: string, ...args: any[]): void {
        if (this.level >= LogLevel.DEBUG) {
            console.debug(`${this.prefix} ${message}`, ...args);
        }
    }

    info(message: string, ...args: any[]): void {
        if (this.level >= LogLevel.INFO) {
            console.info(`${this.prefix} ${message}`, ...args);
        }
    }

    warn(message: string, ...args: any[]): void {
        if (this.level >= LogLevel.WARN) {
            console.warn(`${this.prefix} ${message}`, ...args);
        }
    }

    error(message: string, ...args: any[]): void {
        if (this.level >= LogLevel.ERROR) {
            console.error(`${this.prefix} ${message}`, ...args);
        }
    }
}

/**
 * Creates a logger instance based on provided options
 * @param options Logger configuration options
 * @returns Logger instance
 */
export function createLogger(options?: LoggerOptions): Logger {
    const defaultLogger = new DefaultLogger(options);

    if (!options || !options.customLogger) {
        return defaultLogger;
    }

    // Create a composite logger that uses custom implementation when available
    // and falls back to default implementation
    return {
        debug: options.customLogger.debug || defaultLogger.debug.bind(defaultLogger),
        info: options.customLogger.info || defaultLogger.info.bind(defaultLogger),
        warn: options.customLogger.warn || defaultLogger.warn.bind(defaultLogger),
        error: options.customLogger.error || defaultLogger.error.bind(defaultLogger)
    };
}
