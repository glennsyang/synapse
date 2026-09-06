import { loginSchema } from '$lib/schemas/auth';
import { auth } from '$lib/server/auth';
import {
	createAuthLoadForm,
	mapAuthActionError,
	redirectIfAuthenticated
} from '$lib/server/auth/form-helpers';
import { logger } from '$lib/server/logger';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	redirectIfAuthenticated(locals.user);
	const form = await createAuthLoadForm(loginSchema, url);

	return { form };
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(loginSchema));

		if (!form.valid) {
			return message(form, 'Please correct the errors in the form.', { status: 400 });
		}

		try {
			await auth.api.signInEmail({
				body: {
					email: form.data.email,
					password: form.data.password
				},
				headers: request.headers
			});

			throw redirect(302, '/dashboard');
		} catch (error) {
			// An unverified account can't sign in, but better-auth
			// (emailVerification.sendOnSignIn) has just re-sent a fresh verification
			// link. Send the user to the page that explains that, instead of
			// surfacing a dead-end "email not verified" form error.
			if ((error as { body?: { code?: string } })?.body?.code === 'EMAIL_NOT_VERIFIED') {
				throw redirect(302, `/verify-email?email=${encodeURIComponent(form.data.email)}`);
			}

			const errorMessage = mapAuthActionError(
				error,
				'An error occurred during sign-in. Please try again.'
			);
			logger.error('Sign-in failed', error);

			return message(form, errorMessage, { status: 400 });
		}
	}
} satisfies Actions;
