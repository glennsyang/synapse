import { isRedirect, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { forgotPasswordSchema } from '$lib/schemas/auth';
import { auth } from '$lib/server/auth';
import { getBetterAuthErrorMessage } from '$lib/utils';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Redirect if already signed in
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}

	const form = await superValidate(zod4(forgotPasswordSchema));

	// Check for success message from registration
	const message = url.searchParams.get('message');
	if (message) {
		form.message = message;
	}

	return { form };
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const form = await superValidate(request, zod4(forgotPasswordSchema));

		if (!form.valid) {
			return message(
				form,
				{ type: 'error', text: 'Please correct the errors in the form.' },
				{ status: 400 }
			);
		}

		try {
			const redirectTo = `${url.origin}/reset-password`;

			await auth.api.requestPasswordReset({
				body: {
					email: form.data.email,
					redirectTo
				}
			});

			// Don't reveal if the email exists or not for security reasons
			return message(
				form,
				'If an account exists with that email, you will receive a password reset link.'
			);
		} catch (error) {
			// Don't catch redirects as errors - re-throw them
			if (isRedirect(error)) {
				throw error;
			}

			logger.error('Password reset request failed', error);
			// Get user-friendly error message from better-auth error
			// Don't reveal if the email exists or not for security reasons
			const errorMessage = getBetterAuthErrorMessage(
				error,
				'If an account exists with that email, you will receive a password reset link.'
			);

			return message(form, errorMessage);
		}
	}
} satisfies Actions;
