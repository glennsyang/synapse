import { SIGN_IN_ROUTE } from '$lib/auth-routes';
import { resetPasswordSchema } from '$lib/schemas/auth';
import { handleAuthFormAction, invalidAuthForm } from '$lib/server/actions/auth-form-handler';
import { auth } from '$lib/server/auth';
import { isResetTokenValid } from '$lib/server/auth-reset-url';
import { createAuthLoadForm, redirectIfAuthenticated } from '$lib/server/auth/form-helpers';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	redirectIfAuthenticated(locals.user);
	const token = url.searchParams.get('token');
	const invalid = !token || !(await isResetTokenValid(token));

	const form = await createAuthLoadForm(resetPasswordSchema, url, {
		includeQueryMessage: false
	});

	return { token, invalid, form };
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

				// Whitelisted flag only — the sign-in page renders a fixed confirmation
				// banner for ?reset=success; no message text is reflected through the URL.
				throw redirect(302, `${SIGN_IN_ROUTE}?reset=success`);
			},
			{
				loggerContext: 'Password reset failed',
				fallbackMessage: 'Failed to reset password. Please try again.'
			}
		);
	}
} satisfies Actions;
