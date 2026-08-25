import {
	BETTER_AUTH_BASE_URL,
	BETTER_AUTH_SECRET,
	NODE_ENV,
	RESEND_NEW_USER_ADDRESS
} from '$app/env/private';
import { getRequestEvent } from '$app/server';
import { logger } from '$lib/server/logger';
import { apiKey } from '@better-auth/api-key';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAuthMiddleware } from 'better-auth/api';
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
			apikey: schema.apiKey
		}
	}),
	emailAndPassword: {
		enabled: true,
		autoSignIn: false,
		minPasswordLength: 12,
		maxPasswordLength: 128,
		revokeSessionsOnPasswordReset: true,
		resetPasswordTokenExpiresIn: 60 * 10, // 10 minutes
		sendVerificationEmail: async ({
			user,
			url,
			token
		}: {
			user: { email: string; name: string };
			url: string;
			token: string;
		}) => {
			logger.debug('✉️ Email verification sent');
			const verifyUrl = `${url}?token=${token}`;
			void sendVerificationEmail(user.email, user.name, verifyUrl);
			void sendAuthAlerts(
				`Verification email sent to ${user.email}`,
				'Synapse - Verification Alert',
				3
			);
		},
		sendResetPassword: async ({ user, url, token }) => {
			const urlObj = new URL(url);
			const callbackURL = urlObj.searchParams.get('callbackUrl');
			if (!callbackURL) {
				throw new Error('Missing callbackUrl in reset password URL');
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
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url, token }) => {
			logger.debug('✉️ Sending verification email');
			const verifyUrl = `${url}&token=${token}`;
			void sendVerificationEmail(user.email, user.name, verifyUrl);
			void sendAuthAlerts(
				`Verification email sent to ${user.email}`,
				'Synapse - Verification Alert',
				3
			);
		}
	},
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			if (ctx.path.includes('/register')) {
				const newSession = ctx.context.newSession;
				if (newSession) {
					void sendNewUserEmail(
						RESEND_NEW_USER_ADDRESS,
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
			// Optionally specify custom headers for IP detection (useful behind proxies)
			ipAddressHeaders: ['x-forwarded-for', 'x-real-ip', 'x-client-ip']
		},
		database: {
			generateId: () => crypto.randomUUID()
		}
	},
	user: {
		additionalFields: {
			role: { type: 'string', required: false, defaultValue: 'user', input: false },
			banned: { type: 'boolean', required: false, defaultValue: false, input: false }
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
		'https://synapse.fly.dev',
		...(NODE_ENV === 'development' ? ['http://localhost:5173'] : [])
	],
	rateLimit: {
		enabled: true,
		window: 60, // 1 minute
		max: 5, // max 5 requests per window per IP
		storage: NODE_ENV === 'production' ? 'database' : 'memory'
	},
	plugins: [
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
