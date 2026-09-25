import { BASE_ERROR_CODES } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';

import { sendAuthAlerts } from './notifications';

const GUARDED_PATHS = new Set(['/sign-up/email', '/sign-in/email']);

/**
 * Parse the comma-separated `ALLOWED_EMAILS` env value into a normalised set.
 * Matching is exact after trim + lowercase — never a substring match.
 */
export function parseAllowedEmails(raw: string): Set<string> {
	return new Set(
		raw
			.split(',')
			.map((email) => email.trim().toLowerCase())
			.filter(Boolean)
	);
}

/**
 * `hooks.before` gate for Better Auth: only emails in `allowedEmails` may reach
 * `/sign-in/email` (or `/sign-up/email`, which is also disabled outright via
 * `emailAndPassword.disableSignUp`). Anything else is rejected with the exact
 * error Better Auth throws for a wrong password, so a blocked email can't be told
 * apart from a bad credential, and raises an auth alert.
 */
export function createAllowlistBeforeHook(appName: string, allowedEmails: Set<string>) {
	return createAuthMiddleware(async (ctx) => {
		if (!GUARDED_PATHS.has(ctx.path)) {
			return;
		}
		const email = typeof ctx.body?.email === 'string' ? ctx.body.email.trim().toLowerCase() : '';
		if (email && allowedEmails.has(email)) {
			return;
		}
		void sendAuthAlerts(
			`⚠️ Blocked ${ctx.path} attempt for non-allowlisted email: ${email || '(none)'} at ${new Date().toISOString()}.`,
			`${appName} - Security Alert`,
			4
		);
		throw APIError.from('UNAUTHORIZED', BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD);
	});
}
