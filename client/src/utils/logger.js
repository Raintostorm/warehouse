/**
 * Logger Utility
 * Centralized logging with environment-aware behavior
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

/**
 * Log levels
 */
const LogLevel = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
};

/**
 * Logger class
 */
class Logger {
    log(level, message, ...args) {
        if (isProduction && level === LogLevel.DEBUG) {
            return; // Don't log debug in production
        }

        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

        switch (level) {
            case LogLevel.ERROR:
                console.error(prefix, message, ...args);
                break;
            case LogLevel.WARN:
                console.warn(prefix, message, ...args);
                break;
            case LogLevel.INFO:
                if (isDevelopment) {
                    console.info(prefix, message, ...args);
                }
                break;
            case LogLevel.DEBUG:
                if (isDevelopment) {
                    console.log(prefix, message, ...args);
                }
                break;
            default:
                if (isDevelopment) {
                    console.log(prefix, message, ...args);
                }
        }

        // In production, you might want to send errors to a logging service
        if (isProduction && level === LogLevel.ERROR) {
            // Example: Send to error tracking service (Sentry, LogRocket, etc.)
            // logErrorToService(message, args);
        }
    }

    debug(message, ...args) {
        this.log(LogLevel.DEBUG, message, ...args);
    }

    info(message, ...args) {
        this.log(LogLevel.INFO, message, ...args);
    }

    warn(message, ...args) {
        this.log(LogLevel.WARN, message, ...args);
    }

    error(message, ...args) {
        this.log(LogLevel.ERROR, message, ...args);
    }
}

// Export singleton instance
export const logger = new Logger();
export default logger;
