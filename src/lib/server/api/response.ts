import { json } from '@sveltejs/kit';

/**
 * JSON-API response envelope for `/api/v1/*` routes: exactly one success shape, one error
 * shape, explicit HTTP status, no ad-hoc fourth shape.
 */
export type ApiErrorCode =
	| 'missing_header'
	| 'invalid_scheme'
	| 'malformed_header'
	| 'invalid_api_key'
	| 'rate_limited'
	| 'validation_failed'
	| 'invalid_json'
	| 'not_found'
	| 'internal_error';

export function apiSuccess<T>(data: T, status = 200): Response {
	return json({ data }, { status });
}

export function apiError(code: ApiErrorCode, message: string, status: number): Response {
	return json({ error: { code, message } }, { status });
}
