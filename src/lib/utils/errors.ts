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
