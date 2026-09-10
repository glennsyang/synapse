import { FORGOT_PASSWORD_ROUTE, SIGN_IN_ROUTE } from '$lib/auth-routes';
import { resetPasswordSchema } from '$lib/schemas/auth';
import { handleAuthFormAction, invalidAuthForm } from '$lib/server/actions/auth-form-handler';
import { auth } from '$lib/server/auth';
import { createAuthLoadForm, redirectIfAuthenticated } from '$lib/server/auth/form-helpers';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	redirectIfAuthenticated(locals.user);
	const token = url.searchParams.get('token');

	if (!token) {
		throw redirect(302, FORGOT_PASSWORD_ROUTE);
	}

	const form = await createAuthLoadForm(resetPasswordSchema, url, {
		includeQueryMessage: false
	});

	return { token, form };
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(resetPasswordSchema));

		if (!form.data.token || !form.valid) {
			return invalidAuthForm(form);
		}

		return handleAuthFormAction(
			form,
			async () => {
				await auth.api.resetPassword({
					body: {
						token: form.data.token,
						newPassword: form.data.password
					}
				});

				throw redirect(302, `${SIGN_IN_ROUTE}?message=Password reset successful! Please sign in.`);
			},
			{
				loggerContext: 'Password reset failed',
				fallbackMessage: 'Failed to reset password. Please try again.'
			}
		);
	}
} satisfies Actions;
