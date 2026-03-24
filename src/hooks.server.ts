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

	if (event.url.pathname === '/todos' || event.url.pathname.startsWith('/todos/')) {
		const target = new URL(event.url);
		target.pathname = event.url.pathname.replace(/^\/todos(?=\/|$)/, '/tasks');
		return Response.redirect(target, 307);
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
		"default-src 'self' https://nominatim.openstreetmap.org https://api.open-meteo.com",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for layerchart/d3
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // unsafe-inline needed for SvelteKit, Google Fonts for typography
		"img-src 'self' data: https:",
		"font-src 'self' https://fonts.gstatic.com", // Google Fonts
		"connect-src 'self' https://nominatim.openstreetmap.org https://api.open-meteo.com",
		"manifest-src 'self'",
		"worker-src 'self'",
		"frame-ancestors 'none'",
		"frame-src 'none'",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'"
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
