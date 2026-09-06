import { building } from '$app/env';
import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod';

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'Path to the SQLite database file',
		schema: building ? z.string().catch('file:///tmp/build.db') : z.string().min(1)
	},
	BETTER_AUTH_SECRET: {
		description: 'Secret key for Better Auth session signing (min 32 characters)',
		schema: building
			? z.string().catch('build_time_dummy_secret_min_32_chars_long')
			: z.string().min(32)
	},
	BETTER_AUTH_BASE_URL: {
		description: 'Base URL for Better Auth',
		schema: building ? z.string().catch('http://localhost:5173') : z.url()
	},
	AUTH_ALERTS_URL: {
		description: 'ntfy.sh topic URL for auth push notifications',
		schema: building ? z.string().catch('https://ntfy.sh/placeholder') : z.url()
	},
	REMINDER_ALERTS_URL: {
		description: 'ntfy.sh topic URL for reminder push notifications',
		schema: building ? z.string().catch('https://ntfy.sh/placeholder') : z.url()
	},
	BREVO_API_KEY: {
		description: 'Brevo API key for sending transactional emails',
		schema: building ? z.string().catch('build_time_dummy_key') : z.string().min(1)
	},
	BREVO_FROM_ADDRESS: {
		description:
			'From address for outgoing transactional emails (must be a confirmed Brevo sender)',
		schema: building ? z.string().catch('noreply@example.com') : z.email()
	},
	BREVO_NEW_USER_ADDRESS: {
		description:
			'Email address to receive notifications when a new user signs up (must be a confirmed Brevo sender)',
		schema: building ? z.string().catch('admin@example.com') : z.email()
	},
	CRON_SECRET: {
		description: 'Bearer token for authorizing cron job requests',
		schema: building ? z.string().catch('build_time_dummy_secret_min_16_chars') : z.string().min(16)
	},
	NODE_ENV: {
		description: 'Application environment (development, production, test)',
		schema: z.enum(['development', 'production', 'test']).default('development')
	},
	LOG_LEVEL: {
		description:
			'Minimum log level to emit (debug, info, warn, error); defaults to debug in dev, info in prod',
		schema: z.enum(['debug', 'info', 'warn', 'error']).optional()
	},
	SENTRY_DSN: {
		description: 'Sentry DSN for client + server error/log reporting (not secret; safe to commit)',
		public: true,
		schema: building ? z.string().catch('https://placeholder@o0.ingest.sentry.io/0') : z.url()
	}
});
