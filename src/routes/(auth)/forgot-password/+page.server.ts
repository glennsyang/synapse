import { RESET_PASSWORD_ROUTE } from '$lib/auth-routes';
import { forgotPasswordSchema } from '$lib/schemas/auth';
import { handleAuthFormAction, invalidAuthForm } from '$lib/server/actions/auth-form-handler';
import { auth } from '$lib/server/auth';
import { FORGOT_PASSWORD_RESPONSE } from '$lib/server/auth/forgot-password-response';
import { createAuthLoadForm, redirectIfAuthenticated } from '$lib/server/auth/form-helpers';
import { createAuthRateLimiter, rateLimitedMessage } from '$lib/server/rate-limiter';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

const limiter = createAuthRateLimiter();

export const load: PageServerLoad = async ({ locals, url }) => {
	redirectIfAuthenticated(locals.user);
	const form = await createAuthLoadForm(forgotPasswordSchema, url);

	return { form };
};

export const actions = {
	default: async (event) => {
		const { request } = event;
		const form = await superValidate(request, zod4(forgotPasswordSchema));

		if (!form.valid) {
			return invalidAuthForm(form);
		}

		const rateLimitStatus = await limiter.check(event);
		if (rateLimitStatus.limited) {
			return rateLimitedMessage(form, rateLimitStatus.retryAfter);
		}

		return handleAuthFormAction(
			form,
			async () => {
				await auth.api.requestPasswordReset({
					body: { email: form.data.email, redirectTo: RESET_PASSWORD_ROUTE },
					headers: request.headers
				});

				return message(form, FORGOT_PASSWORD_RESPONSE);
			},
			{
				loggerContext: 'Password reset request failed',
				fallbackMessage: FORGOT_PASSWORD_RESPONSE.text,
				errorType: FORGOT_PASSWORD_RESPONSE.type
			}
		);
	}
} satisfies Actions;
