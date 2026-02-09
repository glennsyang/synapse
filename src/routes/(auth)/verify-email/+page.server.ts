import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	// If already signed in, redirect to dashboard
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}

	// Get email from query params
	const email = url.searchParams.get('email');

	// If no email provided, redirect to sign-in
	if (!email) {
		throw redirect(302, '/sign-in?message=Invalid verification link');
	}

	return {
		email
	};
};
