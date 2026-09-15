import {
	ADMIN_USER_IDS,
	BETTER_AUTH_BASE_URL,
	BETTER_AUTH_SECRET,
	NODE_ENV
} from '$app/env/private';
import { getRequestEvent } from '$app/server';
import { logger } from '$lib/server/logger';
import { apiKey } from '@better-auth/api-key';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, haveIBeenPwned } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';

import { createAuthAfterHooks, logPasswordResetAudit } from './auth-audit-hooks';
import { getDb } from './db';
import * as schema from './db/schema';
import { sendPasswordResetEmail, sendVerificationEmail } from './email';
import { sendAuthAlerts } from './notifications';

export const auth = betterAuth({
	appName: 'Synapse',
	secret: BETTER_AUTH_SECRET,
	baseURL: BETTER_AUTH_BASE_URL,
	database: drizzleAdapter(getDb(), {
		provider: 'sqlite',
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification,
			apikey: schema.apiKey,
			// Required because rateLimit.storage is 'database' in production (see the
			// rateLimit config below). Without this mapping better-auth has nowhere to
			// persist per-IP counters and DB-backed rate limiting silently no-ops.
			rateLimit: schema.rateLimit
		}
	}),
	emailAndPassword: {
		enabled: true,
		autoSignIn: false,
		requireEmailVerification: true,
		minPasswordLength: 12,
		maxPasswordLength: 128,
		revokeSessionsOnPasswordReset: true,
		resetPasswordTokenExpiresIn: 60 * 10, // 10 minutes
		sendResetPassword: async ({ user, url }) => {
			// `url` is Better Auth's own GET-verifier link
			// (/api/auth/reset-password/<token>?callbackURL=...). Pass it straight
			// through — its own originCheck middleware already validated
			// callbackURL against trustedOrigins, and the verifier itself checks
			// the token before redirecting to /reset-password.
			void sendPasswordResetEmail(user.email, user.name, url);
			void sendAuthAlerts(
				`Password reset requested for ${user.email}`,
				'Synapse - Password Reset Alert',
				4
			);
		},
		onPasswordReset: async ({ user }) => {
			logPasswordResetAudit(user, 'Synapse');
		}
	},
	emailVerification: {
		sendOnSignUp: true,
		sendOnSignIn: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			logger.debug('✉️ Sending verification email');
			await sendVerificationEmail(user.email, user.name || user.email, url);
			void sendAuthAlerts(
				`Verification email sent to ${user.email}`,
				'Synapse - Verification Alert',
				3
			);
		}
	},
	hooks: {
		after: createAuthAfterHooks('Synapse')
	},
	advanced: {
		cookiePrefix: 'synapse_auth_',
		useSecureCookies: true,
		ipAddress: {
			// Enable IP address and user agent tracking
			disableIpTracking: false,
			// Fly.io's edge sets this on every request and strips any client-supplied
			// value for it, unlike X-Forwarded-For/X-Real-IP/X-Client-IP, which are
			// trusted outright by better-auth's resolver without a trustedProxies config.
			ipAddressHeaders: ['fly-client-ip', 'x-forwarded-for', 'x-real-ip', 'x-client-ip']
		},
		database: {
			generateId: () => crypto.randomUUID()
		}
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // Update every 24 hours
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5 // 5 minutes client-side cache
		}
	},
	trustedOrigins: [
		new URL(BETTER_AUTH_BASE_URL).origin,
		...(NODE_ENV === 'development' ? ['http://localhost:5173'] : [])
	],
	rateLimit: {
		enabled: true,
		window: 60, // 1 minute
		max: 5, // max 5 requests per window per IP
		storage: NODE_ENV === 'production' ? 'database' : 'memory'
	},
	plugins: [
		// User administration: registers `role` / `banned` / `banReason` / `banExpires` on the
		// `user` model and the `auth.api.listUsers` / `setRole` / `banUser` / `unbanUser` /
		// `removeUser` endpoints, and prevents `role` from being set through sign-up input.
		// `adminUserIds` bootstraps admins by id from the `ADMIN_USER_IDS` env var (no DB write
		// needed); `defaultRole` / `adminRoles` are the plugin defaults, spelled out for parity
		// with the sibling repos.
		admin({
			adminUserIds: ADMIN_USER_IDS.split(','),
			defaultRole: 'user',
			adminRoles: ['admin']
		}),
		// NIST SP 800-63B §5.1.1.2: reject passwords found in a known-breach corpus.
		// Checked via the HIBP k-anonymity range API on the plugin's default paths
		// (/sign-up/email, /change-password, /reset-password, /admin/set-user-password)
		// — only the first 5 hex chars of the password's SHA-1 hash ever leave the
		// server. Fails closed: an HIBP outage blocks the password change rather than
		// silently skipping the check.
		haveIBeenPwned(),
		apiKey({
			references: 'user',
			storage: 'database',
			requireName: true,
			// Only ever verified explicitly via auth.api.verifyApiKey (see src/lib/server/api/require-api-key.ts).
			// Never let a valid API key stand in for a session on the app's own cookie-based routes.
			enableSessionForAPIKeys: false,
			keyExpiration: {
				minExpiresIn: 1,
				maxExpiresIn: 365
			},
			rateLimit: {
				enabled: true,
				timeWindow: 60 * 1000, // 1 minute
				maxRequests: 100
			}
		}),
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
