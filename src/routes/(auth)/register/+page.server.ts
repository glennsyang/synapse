import { isRedirect, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { registerSchema } from '$lib/schemas/auth';
import { auth } from '$lib/server/auth';
import { getBetterAuthErrorMessage } from '$lib/utils';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}

	const form = await superValidate(zod4(registerSchema));

	const message = url.searchParams.get('message');
	if (message) {
		form.message = message;
	}

	return { form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(registerSchema));

		if (!form.valid) {
			return message(
				form,
				{ type: 'error', text: 'Please correct the errors in the form.' },
				{ status: 400 }
			);
		}

		try {
			await auth.api.signUpEmail({
				body: {
					email: form.data.email,
					password: form.data.password,
					name: form.data.name
				},
				headers: request.headers
			});

			// Redirect to verify-email page with user's email
			throw redirect(302, `/verify-email?email=${encodeURIComponent(form.data.email)}`);
		} catch (error) {
			// Don't catch redirects as errors - re-throw them
			if (isRedirect(error)) {
				throw error;
			}

			logger.error('Registration failed', error);
			// Get user-friendly error message from better-auth error
			const errorMessage = getBetterAuthErrorMessage(
				error,
				'Registration failed. Please try again.'
			);

			return message(form, { type: 'error', text: errorMessage }, { status: 400 });
		}
	}
};
