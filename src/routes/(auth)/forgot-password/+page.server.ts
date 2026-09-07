import { forgotPasswordSchema } from '$lib/schemas/auth';
import { auth } from '$lib/server/auth';
import {
	createAuthLoadForm,
	mapAuthActionError,
	redirectIfAuthenticated
} from '$lib/server/auth/form-helpers';
import { logger } from '$lib/server/logger';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	redirectIfAuthenticated(locals.user);
	const form = await createAuthLoadForm(forgotPasswordSchema, url);

	return { form };
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(forgotPasswordSchema));

		if (!form.valid) {
			return message(
				form,
				{ type: 'error', text: 'Please correct the errors in the form.' },
				{ status: 400 }
			);
		}

		try {
			// Route through Better Auth's HTTP handler rather than calling
			// auth.api.requestPasswordReset directly, so the configured per-IP rate
			// limit protects this public, email-sending action too (a direct api call
			// bypasses the rate-limit middleware). Mirrors the verify-email resend
			// action. `redirectTo` is a relative path, which passes Better Auth's
			// origin check; buildResetUrl resolves it against BETTER_AUTH_BASE_URL.
			const headers = new Headers(request.headers);
			headers.set('content-type', 'application/json');
			headers.delete('content-length');

			const response = await auth.handler(
				new Request(new URL('/api/auth/request-password-reset', request.url), {
					method: 'POST',
					headers,
					body: JSON.stringify({ email: form.data.email, redirectTo: '/reset-password' })
				})
			);
			if (!response.ok) {
				throw new Error(`Password reset request failed with status ${response.status}`);
			}

			// Don't reveal if the email exists or not for security reasons
			return message(
				form,
				'If an account exists with that email, you will receive a password reset link.'
			);
		} catch (error) {
			logger.error('Password reset request failed', error);
			const errorMessage = mapAuthActionError(
				error,
				'If an account exists with that email, you will receive a password reset link.'
			);

			return message(form, errorMessage);
		}
	}
} satisfies Actions;
