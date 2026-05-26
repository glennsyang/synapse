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
		const isDevelopment = process.env.NODE_ENV === 'development';
		const errorPayload: Record<string, unknown> = {};

		if (error instanceof Error) {
			errorPayload.error = {
				name: error.name,
				message: error.message,
				...(isDevelopment && error.stack ? { stack: error.stack } : {})
			};
		} else if (error === undefined) {
			// No error payload
		} else if (typeof error === 'string') {
			errorPayload.error = error;
		} else {
			try {
				errorPayload.error = JSON.parse(
					JSON.stringify(error, (_key, val) =>
						val instanceof Error ? { name: val.name, message: val.message } : val
					)
				);
			} catch {
				errorPayload.error = JSON.stringify(error);
			}
		}

		const errorMeta = {
			...meta,
			...errorPayload
		};
		this.log('error', message, errorMeta);
	}
}

// Export singleton instance
export const logger = new Logger();
