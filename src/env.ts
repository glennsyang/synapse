import { building, dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { z } from 'zod';

const envSchema = z.object({
	DATABASE_URL: z.string().min(1),
	BETTER_AUTH_SECRET: z.string().min(32),
	BETTER_AUTH_BASE_URL: z.url(),
	RESEND_API_KEY: z.string().min(1),
	RESEND_FROM_ADDRESS: z.email(),
	RESEND_NEW_USER_ADDRESS: z.email(),
	AUTH_ALERTS_URL: z.url(),
	REMINDER_ALERTS_URL: z.url(),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

// Only validate in production (skip during build and dev)
if (!building && !dev) {
	try {
		envSchema.parse(process.env);
	} catch (error) {
		console.error('❌ Environment validation failed:', error);
		process.exit(1);
	}
}

/**
 * Build-time fallback values for environment variables.
 * These are used when the app is being built and actual env vars may not be available.
 */
const ENV_FALLBACKS = {
	DATABASE_URL: 'file:///tmp/build.db',
	BETTER_AUTH_SECRET: 'build_time_dummy_secret_min_32_chars_long',
	BETTER_AUTH_BASE_URL: 'http://localhost:5173',
	RESEND_API_KEY: 'dummy_key_for_build',
	RESEND_FROM_ADDRESS: 'noreply@example.com',
	RESEND_NEW_USER_ADDRESS: 'admin@example.com',
	AUTH_ALERTS_URL: 'https://notification-service.com/dummy_topic_for_auth_alerts',
	REMINDER_ALERTS_URL: 'https://notification-service.com/dummy_topic_for_reminders',
	NODE_ENV: 'development'
} as const;

function assertProductionVar(name: string, value: string | undefined, fallback: string): string {
	if (!value) {
		console.error(`❌ CRITICAL: ${name} is required in production`);
		process.exit(1);
	}
	if (value === fallback) {
		console.error(`❌ CRITICAL: Cannot use dummy ${name} in production`);
		process.exit(1);
	}
	return value;
}

/**
 * Get environment variables with automatic fallback to build-time defaults.
 * This is the single source of truth for accessing environment variables.
 *
 * Critical variables (BETTER_AUTH_SECRET, DATABASE_URL, AUTH_ALERTS_URL, REMINDER_ALERTS_URL):
 * - During build: use fallbacks
 * - In development: allow fallbacks for convenience
 * - In production: require real values, no fallbacks, fail fast if missing or using dummy values
 *
 * @returns Object containing all environment variables with fallbacks applied
 */
export function getEnv() {
	let betterAuthSecret: string;
	let databaseUrl: string;
	let authAlertsUrl: string;
	let reminderAlertsUrl: string;

	if (building) {
		// During build: use fallbacks
		betterAuthSecret = ENV_FALLBACKS.BETTER_AUTH_SECRET;
		databaseUrl = ENV_FALLBACKS.DATABASE_URL;
		authAlertsUrl = ENV_FALLBACKS.AUTH_ALERTS_URL;
		reminderAlertsUrl = ENV_FALLBACKS.REMINDER_ALERTS_URL;
	} else if (dev) {
		// In development: allow fallbacks for convenience
		betterAuthSecret = env.BETTER_AUTH_SECRET || ENV_FALLBACKS.BETTER_AUTH_SECRET;
		databaseUrl = env.DATABASE_URL || ENV_FALLBACKS.DATABASE_URL;
		authAlertsUrl = env.AUTH_ALERTS_URL || ENV_FALLBACKS.AUTH_ALERTS_URL;
		reminderAlertsUrl = env.REMINDER_ALERTS_URL || ENV_FALLBACKS.REMINDER_ALERTS_URL;
	} else {
		// In production: require real values, no fallbacks
		betterAuthSecret = assertProductionVar(
			'BETTER_AUTH_SECRET',
			env.BETTER_AUTH_SECRET,
			ENV_FALLBACKS.BETTER_AUTH_SECRET
		);
		databaseUrl = assertProductionVar('DATABASE_URL', env.DATABASE_URL, ENV_FALLBACKS.DATABASE_URL);
		authAlertsUrl = assertProductionVar(
			'AUTH_ALERTS_URL',
			env.AUTH_ALERTS_URL,
			ENV_FALLBACKS.AUTH_ALERTS_URL
		);
		reminderAlertsUrl = assertProductionVar(
			'REMINDER_ALERTS_URL',
			env.REMINDER_ALERTS_URL,
			ENV_FALLBACKS.REMINDER_ALERTS_URL
		);
	}

	return {
		DATABASE_URL: databaseUrl,
		BETTER_AUTH_SECRET: betterAuthSecret,
		AUTH_ALERTS_URL: authAlertsUrl,
		REMINDER_ALERTS_URL: reminderAlertsUrl,
		// Less critical vars can use fallbacks in any environment
		BETTER_AUTH_BASE_URL: env.BETTER_AUTH_BASE_URL || ENV_FALLBACKS.BETTER_AUTH_BASE_URL,
		RESEND_API_KEY: env.RESEND_API_KEY || ENV_FALLBACKS.RESEND_API_KEY,
		RESEND_FROM_ADDRESS: env.RESEND_FROM_ADDRESS || ENV_FALLBACKS.RESEND_FROM_ADDRESS,
		RESEND_NEW_USER_ADDRESS: env.RESEND_NEW_USER_ADDRESS || ENV_FALLBACKS.RESEND_NEW_USER_ADDRESS,
		NODE_ENV: (env.NODE_ENV as 'development' | 'production' | 'test') || ENV_FALLBACKS.NODE_ENV
	};
}
