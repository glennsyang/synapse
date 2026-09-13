import {
	ADMIN_USER_IDS,
	BETTER_AUTH_BASE_URL,
	BETTER_AUTH_SECRET,
	NODE_ENV,
	BREVO_NEW_USER_ADDRESS
} from '$app/env/private';
import { getRequestEvent } from '$app/server';
import { logger } from '$lib/server/logger';
import { apiKey } from '@better-auth/api-key';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { admin } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';

import { buildResetUrl } from './auth-reset-url';
import { getDb } from './db';
import * as schema from './db/schema';
import { sendNewUserEmail, sendPasswordResetEmail, sendVerificationEmail } from './email';
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
		sendResetPassword: async ({ user, url, token }) => {
			const urlObj = new URL(url);
			// Better Auth spells the param `callbackURL` (see api/routes/password.mjs);
			// the old lowercase lookup always returned null and threw before the email
			// could be sent.
			const callbackURL = urlObj.searchParams.get('callbackURL');
			if (!callbackURL) {
				throw new Error('Missing callbackURL in reset password URL');
			}
			const resetUrl = buildResetUrl(callbackURL, token);
			void sendPasswordResetEmail(user.email, user.name, resetUrl);
			void sendAuthAlerts(
				`Password reset requested for ${user.email}`,
				'Synapse - Password Reset Alert',
				4
			);
		},
		onPasswordReset: async ({ user }) => {
			logger.info('🔐 Security event: password reset completed and sessions revoked', {
				userId: user.id,
				email: user.email,
				timestamp: new Date().toISOString()
			});
			void sendAuthAlerts(
				`Password reset completed for ${user.email}`,
				'Synapse - Password Reset Completed',
				2
			);
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
		before: createAuthMiddleware(async (ctx) => {
			// Server-side defense-in-depth: the register Zod schema (src/lib/schemas/auth.ts)
			// already enforces this complexity rule, but that only covers requests that went
			// through the app's form action. Enforcing it here too covers any direct caller of
			// auth.api.signUpEmail. Better Auth's internal endpoint for
			// this is `/sign-up/email` — the app's own `/register` route is just the SvelteKit
			// page that calls it, never the value ctx.path takes here.
			if (!ctx.path.includes('/sign-up/email') || !ctx.body?.password) {
				return;
			}
			const password = ctx.body.password;
			const hasUpperCase = /[A-Z]/.test(password);
			const hasLowerCase = /[a-z]/.test(password);
			const hasNumbers = /\d/.test(password);
			const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
			if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
				throw new APIError('BAD_REQUEST', {
					message: 'Password must contain uppercase, lowercase, numbers, and special characters'
				});
			}
		}),
		after: createAuthMiddleware(async (ctx) => {
			if (ctx.path.includes('/register')) {
				const newSession = ctx.context.newSession;
				if (newSession) {
					void sendNewUserEmail(
						BREVO_NEW_USER_ADDRESS,
						newSession.user.name,
						newSession.user.email
					);
					void sendAuthAlerts(
						`New user registered: ${newSession.user.email}`,
						'Synapse - New User Alert',
						4
					);
				}
			}
			// Audit logging
			if (ctx.path.includes('/sign-in')) {
				logger.debug('✅ Sign-in successful', {
					userId: ctx.context.session?.user.id,
					path: ctx.path
				});
			}
			if (ctx.path.includes('/reset-password')) {
				logger.info('🔑 Password reset requested');
				void sendAuthAlerts(
					`Password reset requested for ${ctx.context.session?.user.email}`,
					'Synapse - Password Reset Alert',
					4
				);
			}
		})
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
