import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAuthMiddleware } from 'better-auth/api';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { logger } from '$lib/utils/logger';
import { getEnv } from '../../env';
import { getDb } from './db';
import * as schema from './db/schema';
import { sendNewUserEmail, sendPasswordResetEmail, sendVerificationEmail } from './email';
import { sendAuthAlerts } from './notifications';

const env = getEnv();

export const auth = betterAuth({
	appName: 'Synapse',
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_BASE_URL,
	database: drizzleAdapter(getDb(), {
		provider: 'sqlite',
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification
		}
	}),
	emailAndPassword: {
		enabled: true,
		autoSignIn: false,
		minPasswordLength: 12,
		maxPasswordLength: 128,
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
			const urlObj = new URL(url, 'http://localhost');
			const callbackUrl = urlObj.searchParams.get('callbackUrl');
			if (!callbackUrl) {
				throw new Error('Missing callbackUrl in reset password URL');
			}
			const resetUrl = `${callbackUrl}?token=${token}`;
			void sendPasswordResetEmail(user.email, user.name, resetUrl);
			void sendAuthAlerts(
				`Password reset requested for ${user.email}`,
				'Synapse - Password Reset Alert',
				4
			);
		},
		onPasswordReset: async ({ user }) => {
			logger.debug('🔐 Password reset completed', { userId: user.id });
			sendAuthAlerts(
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
			logger.debug('✉️ Sending verification email', { userId: user.id });
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
						env.RESEND_NEW_USER_ADDRESS,
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
		...(env.NODE_ENV === 'development' ? ['http://localhost:5173'] : [])
	],
	rateLimit: {
		enabled: true,
		window: 60, // 1 minute
		max: 5, // max 5 requests per window per IP
		storage: env.NODE_ENV === 'production' ? 'database' : 'memory'
	},
	plugins: [sveltekitCookies(getRequestEvent)] // make sure this is the last plugin in the array
});
