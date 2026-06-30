import { BETTER_AUTH_BASE_URL, NODE_ENV } from '$app/env/private';
import { logger } from '$lib';

/**
 * Allowlisted origins for password-reset callback URLs.
 * The callbackURL from the reset request is validated against this list
 * before the token is appended, preventing open-redirect token leakage.
 */
const ALLOWED_RESET_ORIGINS = new Set([
	new URL(BETTER_AUTH_BASE_URL).origin,
	...(NODE_ENV === 'development' ? ['http://localhost:5173'] : [])
]);

/**
 * Validates `callbackURL` against the allowed-origins allowlist and returns
 * a safe reset URL with the token appended via searchParams.
 *
 * @throws if `callbackURL` is not a valid URL or its origin is not in the allowlist.
 */
export function buildResetUrl(callbackURL: string, token: string): string {
	let parsed: URL;
	try {
		parsed = new URL(callbackURL);
	} catch {
		throw new Error('Invalid callbackURL: not a valid URL');
	}

	if (!ALLOWED_RESET_ORIGINS.has(parsed.origin)) {
		logger.warn('Password reset blocked: untrusted callbackURL origin', {
			origin: parsed.origin
		});
		throw new Error(`Untrusted callbackURL origin: ${parsed.origin}`);
	}

	parsed.searchParams.set('token', token);
	return parsed.toString();
}
