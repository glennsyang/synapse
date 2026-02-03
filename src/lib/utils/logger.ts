/**
 * Structured logging utility with request ID tracking
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
	requestId?: string;
	userId?: string;
	[key: string]: unknown;
}

class Logger {
	private context: LogContext = {};

	/**
	 * Set global context for all logs
	 */
	setContext(context: LogContext) {
		this.context = { ...this.context, ...context };
	}

	/**
	 * Clear context
	 */
	clearContext() {
		this.context = {};
	}

	/**
	 * Create a child logger with additional context
	 */
	child(context: LogContext): Logger {
		const childLogger = new Logger();
		childLogger.setContext({ ...this.context, ...context });
		return childLogger;
	}

	private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
		const logEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			...this.context,
			...meta
		};

		const output = JSON.stringify(logEntry);

		switch (level) {
			case 'debug':
				console.debug(output);
				break;
			case 'info':
				console.info(output);
				break;
			case 'warn':
				console.warn(output);
				break;
			case 'error':
				console.error(output);
				break;
		}
	}

	debug(message: string, meta?: Record<string, unknown>) {
		this.log('debug', message, meta);
	}

	info(message: string, meta?: Record<string, unknown>) {
		this.log('info', message, meta);
	}

	warn(message: string, meta?: Record<string, unknown>) {
		this.log('warn', message, meta);
	}

	error(message: string, error?: unknown, meta?: Record<string, unknown>) {
		const errorMeta = {
			...meta,
			...(error instanceof Error
				? {
						error: {
							name: error.name,
							message: error.message,
							stack: error.stack
						}
					}
				: { error: String(error) })
		};
		this.log('error', message, errorMeta);
	}
}

// Export singleton instance
export const logger = new Logger();

/**
 * Create logger with request context
 */
export function createRequestLogger(requestId: string, userId?: string): Logger {
	return logger.child({ requestId, userId });
}

/**
 * Middleware helper to add logging to request handlers
 */
export function withLogging<T>(
	requestId: string,
	userId: string | undefined,
	fn: (logger: Logger) => Promise<T>
): Promise<T> {
	const requestLogger = createRequestLogger(requestId, userId);
	return fn(requestLogger);
}
