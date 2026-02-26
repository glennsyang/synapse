/**
 * Error handling utilities for consistent error responses
 */

import { logger } from './logger';

export class AppError extends Error {
	constructor(
		message: string,
		public statusCode: number = 500,
		public code?: string
	) {
		super(message);
		this.name = 'AppError';
	}
}

export class ValidationError extends AppError {
	constructor(
		message: string,
		public fields?: Record<string, string>
	) {
		super(message, 400, 'VALIDATION_ERROR');
		this.name = 'ValidationError';
	}
}

export class AuthenticationError extends AppError {
	constructor(message: string = 'Authentication required') {
		super(message, 401, 'AUTHENTICATION_ERROR');
		this.name = 'AuthenticationError';
	}
}

export class AuthorizationError extends AppError {
	constructor(message: string = 'Insufficient permissions') {
		super(message, 403, 'AUTHORIZATION_ERROR');
		this.name = 'AuthorizationError';
	}
}

export class NotFoundError extends AppError {
	constructor(message: string = 'Resource not found') {
		super(message, 404, 'NOT_FOUND');
		this.name = 'NotFoundError';
	}
}

export class ConflictError extends AppError {
	constructor(message: string = 'Resource conflict') {
		super(message, 409, 'CONFLICT');
		this.name = 'ConflictError';
	}
}

/**
 * Format error for API response
 */
export function formatError(error: unknown) {
	if (error instanceof AppError) {
		return {
			error: {
				message: error.message,
				code: error.code,
				statusCode: error.statusCode,
				...(error instanceof ValidationError && error.fields ? { fields: error.fields } : {})
			}
		};
	}

	// Handle unknown errors
	const message = error instanceof Error ? error.message : 'An unexpected error occurred';
	return {
		error: {
			message,
			code: 'INTERNAL_ERROR',
			statusCode: 500
		}
	};
}

/**
 * Log error with context
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
	const errorInfo = {
		timestamp: new Date().toISOString(),
		error: error instanceof Error ? error.message : String(error),
		stack: error instanceof Error ? error.stack : undefined,
		...context
	};

	logger.error('[ERROR]', JSON.stringify(errorInfo));
}

/**
 * Handle async errors in server actions
 */
export async function handleAsync<T>(
	fn: () => Promise<T>,
	context?: Record<string, unknown>
): Promise<T> {
	try {
		return await fn();
	} catch (error) {
		logError(error, context);
		throw error;
	}
}
