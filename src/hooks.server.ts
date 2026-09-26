import { building, dev } from '$app/env';
import { SENTRY_DSN } from '$app/env/public';
import { allowedEmails, auth } from '$lib/server/auth';
import { isUserAccessAllowed } from '$lib/server/auth-allowlist-hook';
import { logger } from '$lib/server/logger';
import * as Sentry from '@sentry/sveltekit';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';

Sentry.init({
	dsn: SENTRY_DSN,
	tracesSampleRate: 1.0,
	enableLogs: true
	// sendDefaultPii intentionally left at its default (false) here, unlike hooks.client.ts.
	// Enabling it server-side would let Sentry capture full request headers and cookies —
	// including the auth session cookie — which client-side sendDefaultPii can't reach since
	// browser JS has no access to HttpOnly cookies or server-internal headers. Server-side
	// error context is already captured explicitly below (requestId, userId, url, method,
	// status) via the structured logger, so Sentry's own PII capture isn't needed here.
});

export const handle: Handle = sequence(Sentry.sentryHandle(), async ({ event, resolve }) => {
	if (dev && event.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
		return new Response(undefined, { status: 404 });
	}

	// Generate unique request ID for logging
	const requestId = crypto.randomUUID();
	event.locals.requestId = requestId;

	// Create logger with request context
	let requestLogger = logger.child({
		requestId,
		method: event.request.method,
		url: event.url.pathname
	});

	const startTime = Date.now();

	// Log incoming request
	requestLogger.info('Incoming request', {
		userAgent: event.request.headers.get('user-agent')
	});

	// Better-auth session middleware
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	// Make session and user available on server
	// better-auth types optional DB fields with `?:` while our Drizzle schema uses `| null`;
	// runtime values are always string | null (never undefined), so the cast is safe.
	// The allowlist and ban are otherwise only checked when a session is created, so a
	// user removed from ALLOWED_EMAILS (or banned) would keep a self-extending session.
	// Re-check on every request — this also covers the 5-minute cookie cache window.
	if (session && !isUserAccessAllowed(session.user, allowedEmails)) {
		requestLogger.warn('Session rejected', {
			userId: session.user.id,
			reason: 'owner_not_allowed'
		});
		try {
			await auth.api.revokeSession({
				body: { token: session.session.token },
				headers: event.request.headers
			});
		} catch (err) {
			requestLogger.error('Failed to revoke disallowed session', err, {
				userId: session.user.id
			});
		}
	} else if (session) {
		event.locals.session = session.session as NonNullable<typeof event.locals.session>;
		event.locals.user = session.user as NonNullable<typeof event.locals.user>;

		// Add user context to logger
		requestLogger = requestLogger.child({ userId: session.user.id });
	}

	const response = await svelteKitHandler({ event, resolve, auth, building });

	// Log response
	const duration = Date.now() - startTime;
	requestLogger.info('Request completed', {
		status: response.status,
		duration: `${duration}ms`
	});

	// Security headers
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');

	// Add request ID to response headers for tracing
	response.headers.set('X-Request-ID', requestId);

	// HSTS only in production
	if (!dev) {
		response.headers.set(
			'Strict-Transport-Security',
			'max-age=31536000; includeSubDomains; preload'
		);
	}

	// Content-Security-Policy is managed via kit.csp in svelte.config.js (nonce mode).
	// SvelteKit generates a per-request nonce, injects it into the inline scripts/styles
	// it produces, and sets the CSP header automatically. Do NOT set Content-Security-Policy
	// here — it would override the nonce-bearing header SvelteKit emits. See docs/CSP.md in
	// sheppakai-budget for the cross-repo strategy and per-app allowances.

	return response;
});

/**
 * Global error handler with structured logging and stack trace capture
 *
 * Note: logger.error() already forwards to Sentry (captureException) internally in
 * production, so this is intentionally NOT wrapped in Sentry.handleErrorWithSentry() —
 * doing so would double-report every unhandled error.
 */
export const handleError: HandleServerError = ({ error, event, status, message }) => {
	const requestId = event.locals.requestId || 'unknown';
	const userId = event.locals.user?.id || 'anonymous';

	// Log error with sanitized context
	logger.error('Unhandled server error', error, {
		requestId,
		userId,
		url: event.url.pathname,
		method: event.request.method,
		status,
		message,
		userAgent: event.request.headers.get('user-agent')
	});

	// Return safe error message to client (hide internals in production)
	return {
		message: dev ? message : 'An unexpected error occurred',
		requestId
	};
};
