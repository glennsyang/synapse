import { RESET_PASSWORD_ROUTE } from '$lib/auth-routes';
import { forgotPasswordSchema } from '$lib/schemas/auth';
import { handleAuthFormAction, invalidAuthForm } from '$lib/server/actions/auth-form-handler';
import { auth } from '$lib/server/auth';
import { createAuthLoadForm, redirectIfAuthenticated } from '$lib/server/auth/form-helpers';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

// Deliberately ambiguous: identical text *and* styling on success and failure so
// the banner can't be used to probe whether an account exists.
const GENERIC_RESULT =
	'If an account exists with that email, you will receive a password reset link.';

export const load: PageServerLoad = async ({ locals, url }) => {
	redirectIfAuthenticated(locals.user);
	const form = await createAuthLoadForm(forgotPasswordSchema, url);

	return { form };
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(forgotPasswordSchema));

		if (!form.valid) {
			return invalidAuthForm(form);
		}

		return handleAuthFormAction(
			form,
			async () => {
				// Route through Better Auth's HTTP handler rather than calling
				// auth.api.requestPasswordReset directly, so the configured per-IP rate
				// limit protects this public, email-sending action too (a direct api call
				// bypasses the rate-limit middleware). Mirrors the verify-email resend
				// action. `redirectTo` is a relative path, which passes Better Auth's
				// origin check; buildResetUrl resolves it against BETTER_AUTH_BASE_URL.
				const headers = new Headers(request.headers);
				headers.set('content-type', 'application/json');
				headers.delete('content-length');

				const response = await auth.handler(
					new Request(new URL('/api/auth/request-password-reset', request.url), {
						method: 'POST',
						headers,
						body: JSON.stringify({ email: form.data.email, redirectTo: RESET_PASSWORD_ROUTE })
					})
				);
				if (!response.ok) {
					throw new Error(`Password reset request failed with status ${response.status}`);
				}

				return message(form, { type: 'success', text: GENERIC_RESULT });
			},
			{
				loggerContext: 'Password reset request failed',
				fallbackMessage: GENERIC_RESULT,
				errorType: 'success'
			}
		);
	}
} satisfies Actions;
