import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { resetPasswordSchema } from '$lib/schemas/auth';
import { auth } from '$lib/server/auth';
import {
	createAuthLoadForm,
	mapAuthActionError,
	redirectIfAuthenticated
} from '$lib/server/auth/form-helpers';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	redirectIfAuthenticated(locals.user);
	const token = url.searchParams.get('token');

	if (!token) {
		throw redirect(302, '/forgot-password');
	}

	const form = await createAuthLoadForm(resetPasswordSchema, url, {
		includeQueryMessage: false
	});

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
			logger.error('Password reset failed', error);
			const errorMessage = mapAuthActionError(error, 'Failed to reset password. Please try again.');

			return message(form, { type: 'error', text: errorMessage }, { status: 400 });
		}
	}
} satisfies Actions;
