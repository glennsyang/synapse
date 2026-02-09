import { isRedirect, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { resetPasswordSchema } from '$lib/schemas/auth';
import { auth } from '$lib/server/auth';
import { getBetterAuthErrorMessage } from '$lib/utils';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Redirect if already signed in
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}
	const token = url.searchParams.get('token');

	if (!token) {
		throw redirect(302, '/forgot-password');
	}

	const form = await superValidate(zod4(resetPasswordSchema));

	return { token, form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(resetPasswordSchema));

		if (!form.data.token || !form.valid) {
			return message(
				form,
				{ type: 'error', text: 'Please correct the errors in the form.' },
				{ status: 400 }
			);
		}

		try {
			await auth.api.resetPassword({
				body: {
					token: form.data.token,
					newPassword: form.data.password
				}
			});

			throw redirect(302, '/sign-in?message=Password reset successful! Please sign in.');
		} catch (error) {
			// Don't catch redirects as errors - re-throw them
			if (isRedirect(error)) {
				throw error;
			}

			logger.error('Password reset failed', error);
			// Get user-friendly error message from better-auth error
			const errorMessage = getBetterAuthErrorMessage(
				error,
				'Failed to reset password. Please try again.'
			);

			return message(form, { type: 'error', text: errorMessage }, { status: 400 });
		}
	}
} satisfies Actions;
