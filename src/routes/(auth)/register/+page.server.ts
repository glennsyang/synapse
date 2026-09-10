import { VERIFY_EMAIL_ROUTE } from '$lib/auth-routes';
import { registerSchema } from '$lib/schemas/auth';
import { handleAuthFormAction, invalidAuthForm } from '$lib/server/actions/auth-form-handler';
import { auth } from '$lib/server/auth';
import { createAuthLoadForm, redirectIfAuthenticated } from '$lib/server/auth/form-helpers';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
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
			return invalidAuthForm(form);
		}

		return handleAuthFormAction(
			form,
			async () => {
				await auth.api.signUpEmail({
					body: {
						email: form.data.email,
						password: form.data.password,
						name: form.data.name
					},
					headers: request.headers
				});

				// Redirect to verify-email page with user's email
				throw redirect(302, `${VERIFY_EMAIL_ROUTE}?email=${encodeURIComponent(form.data.email)}`);
			},
			{
				loggerContext: 'Registration failed',
				fallbackMessage: 'Registration failed. Please try again.'
			}
		);
	}
} satisfies Actions;
