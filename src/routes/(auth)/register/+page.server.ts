import { registerSchema } from '$lib/schemas/auth';
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
	const form = await createAuthLoadForm(registerSchema, url);

	return { form };
};

export const actions = {
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
			const errorMessage = mapAuthActionError(error, 'Registration failed. Please try again.');
			logger.error('Registration failed', error);

			return message(form, { type: 'error', text: errorMessage }, { status: 400 });
		}
	}
} satisfies Actions;
