import { BETTER_AUTH_BASE_URL } from '$app/env/private';
import { forgotPasswordSchema } from '$lib/schemas/auth';
import { auth } from '$lib/server/auth';
import {
	createAuthLoadForm,
	mapAuthActionError,
	redirectIfAuthenticated
} from '$lib/server/auth/form-helpers';
import { logger } from '$lib/utils/logger';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	redirectIfAuthenticated(locals.user);
	const form = await createAuthLoadForm(forgotPasswordSchema, url);

	return { form };
};

export const actions: Actions = {
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
			const redirectTo = `${BETTER_AUTH_BASE_URL}/reset-password`;

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
			logger.error('Password reset request failed', error);
			const errorMessage = mapAuthActionError(
				error,
				'If an account exists with that email, you will receive a password reset link.'
			);

			return message(form, errorMessage);
		}
	}
} satisfies Actions;
