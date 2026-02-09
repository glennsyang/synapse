import type { Handle, HandleServerError } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

import { building, dev } from '$app/environment';
import { auth } from '$lib/server/auth';
import { generateId } from '$lib/server/db/utils';
import { logger } from '$lib/utils/logger';

export const handle: Handle = async ({ event, resolve }) => {
	if (dev && event.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
		return new Response(undefined, { status: 404 });
	}

	// Generate unique request ID for logging
	const requestId = generateId();
	event.locals.requestId = requestId;

	// Create logger with request context
	const requestLogger = logger.child({
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
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;

		// Add user context to logger
		requestLogger.setContext({ userId: session.user.id });
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

	// Content Security Policy (adjust as needed)
	const csp = [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for layerchart/d3
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // unsafe-inline needed for SvelteKit, Google Fonts for typography
		"img-src 'self' data: https:",
		"font-src 'self' https://fonts.gstatic.com", // Google Fonts
		"connect-src 'self'",
		"frame-ancestors 'none'"
	].join('; ');

	response.headers.set('Content-Security-Policy', csp);

	return response;
};

/**
 * Global error handler with structured logging and stack trace capture
 */
export const handleError: HandleServerError = ({ error, event, status, message }) => {
	const requestId = event.locals.requestId || 'unknown';
	const userId = event.locals.user?.id || 'anonymous';

	// Log error with full context and stack trace
	logger.error(
		'Unhandled server error',
		{
			requestId,
			userId,
			url: event.url.pathname,
			method: event.request.method,
			status,
			message,
			userAgent: event.request.headers.get('user-agent')
		},
		{
			stack: error instanceof Error ? error.stack : undefined,
			name: error instanceof Error ? error.name : 'Unknown',
			cause: error instanceof Error ? JSON.stringify(error.cause) : undefined
		}
	);

	// Return safe error message to client (hide internals in production)
	return {
		message: dev ? message : 'An unexpected error occurred',
		requestId
	};
};
