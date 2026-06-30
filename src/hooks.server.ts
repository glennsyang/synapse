import { building, dev } from '$app/env';
import { logger } from '$lib';
import { auth } from '$lib/server/auth';
import { generateId } from '$lib/server/db/utils';
import type { Handle, HandleServerError, ResolveOptions } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

// Fixed-window rate limiter for non-GET, non-auth mutations (60 req / 60 s per IP).
// Prevents scripted abuse of task/journal/fitness/visit endpoints.
const mutationRateMap = new Map<string, { count: number; windowStart: number }>();
const MUTATION_LIMIT = 60;
const MUTATION_WINDOW_MS = 60_000;

function isMutationRateLimited(ip: string): boolean {
	const now = Date.now();
	const entry = mutationRateMap.get(ip);
	if (!entry || now - entry.windowStart >= MUTATION_WINDOW_MS) {
		mutationRateMap.set(ip, { count: 1, windowStart: now });
		// Prune stale entries when the map grows large to avoid unbounded memory use.
		if (mutationRateMap.size > 10_000) {
			for (const [key, val] of mutationRateMap) {
				if (now - val.windowStart >= MUTATION_WINDOW_MS) mutationRateMap.delete(key);
			}
		}
		return false;
	}
	entry.count += 1;
	return entry.count > MUTATION_LIMIT;
}

export const handle: Handle = async ({ event, resolve }) => {
	// Generate a per-request CSP nonce
	const nonceArray = new Uint8Array(16);
	crypto.getRandomValues(nonceArray);
	const nonce = Buffer.from(nonceArray).toString('base64url');

	// Wrap resolve so SvelteKit's injected inline scripts carry the nonce
	const resolveWithNonce = (evt: Parameters<Handle>[0]['event'], opts?: ResolveOptions) =>
		resolve(evt, {
			...opts,
			transformPageChunk: async ({ html, done }) => {
				const intermediate = (await opts?.transformPageChunk?.({ html, done })) ?? html;
				return intermediate.replaceAll(/<script(?![^>]*\bnonce=)/g, `<script nonce="${nonce}"`);
			}
		});

	if (dev && event.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
		return new Response(undefined, { status: 404 });
	}

	if (
		event.request.method !== 'GET' &&
		!event.url.pathname.startsWith('/api/auth') &&
		isMutationRateLimited(event.getClientAddress())
	) {
		return new Response('Too Many Requests', { status: 429 });
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
	// better-auth types optional DB fields with `?:` while our Drizzle schema uses `| null`;
	// runtime values are always string | null (never undefined), so the cast is safe.
	if (session) {
		event.locals.session = session.session as NonNullable<typeof event.locals.session>;
		event.locals.user = session.user as NonNullable<typeof event.locals.user>;

		// Add user context to logger
		requestLogger.setContext({ userId: session.user.id });
	}

	const response = await svelteKitHandler({ event, resolve: resolveWithNonce, auth, building });

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

	// Content Security Policy
	const csp = [
		"default-src 'self' https://nominatim.openstreetmap.org https://api.open-meteo.com",
		// Note: sveltekit-superforms -> arktype -> @ark/util fires a one-shot CSP probe on first
		// import: new Function("return false")(). Our CSP blocks it (expected), the catch returns
		// true, and ArkType sets jitless:true for the session. The resulting console warning is
		// benign — do not add 'unsafe-eval' to suppress it.
		`script-src 'self' 'nonce-${nonce}'`,
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // unsafe-inline retained: chart-style.svelte injects dynamic <style> blocks
		"style-src-attr 'unsafe-inline'", // narrower than style-src; ready to drop style-src unsafe-inline once chart-style.svelte is refactored
		"img-src 'self' data: https:",
		"font-src 'self' https://fonts.gstatic.com",
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
