import { POST_LOGIN_ROUTE } from '$lib/auth-routes';
import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// If user is authenticated, redirect to dashboard
	if (locals.user) {
		throw redirect(302, POST_LOGIN_ROUTE);
	}

	return {};
};
