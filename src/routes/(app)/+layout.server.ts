import { redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Redirect to sign-in if not authenticated for other routes
	if (!locals.user) {
		throw redirect(302, '/sign-in');
	}

	return {
		user: locals.user
	};
};
