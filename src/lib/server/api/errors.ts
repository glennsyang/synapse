import type { ApiErrorCode } from './response';

/**
 * Thrown by `db/writes/*` functions for expected, user-facing failures (not found,
 * a duplicate title, etc.) so route handlers can map them straight to an `apiError`
 * response instead of falling through to a generic 500.
 */
export class ApiWriteError extends Error {
	code: ApiErrorCode;
	status: number;

	constructor(code: ApiErrorCode, message: string, status: number) {
		super(message);
		this.name = 'ApiWriteError';
		this.code = code;
		this.status = status;
	}
}
