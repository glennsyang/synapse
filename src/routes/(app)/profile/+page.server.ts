import { eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { changePasswordSchema, updateProfileSchema } from '$lib/schemas/auth';
import { auth } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { account, user } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const db = getDb();

	// Get the full user data including updatedAt
	const fullUserData = await db.query.user.findFirst({
		where: eq(user.id, locals.user.id)
	});

	// Get the account data to find when password was last updated
	const accountData = await db.query.account.findFirst({
		where: eq(account.userId, locals.user.id)
	});

	// Initialize profile form with current user data
	const profileForm = await superValidate(
		{ name: fullUserData?.name || '' },
		zod4(updateProfileSchema)
	);
	const passwordForm = await superValidate(zod4(changePasswordSchema));

	return {
		user: fullUserData || locals.user,
		profileForm,
		passwordForm,
		passwordUpdatedAt: accountData?.updatedAt || null
	};
};

export const actions: Actions = {
	update: async ({ request, locals }) => {
		const currentUser = locals.user;

		const form = await superValidate(request, zod4(updateProfileSchema));
		if (!form.valid) {
			return message(
				form,
				{ type: 'error', text: 'Please correct the errors in the form.' },
				{ status: 400 }
			);
		}

		try {
			await getDb().update(user).set({ name: form.data.name }).where(eq(user.id, currentUser.id));

			logger.info('User profile updated successfully', {
				userId: currentUser.id,
				name: form.data.name
			});
			return message(form, { type: 'success', text: 'Profile updated successfully.' });
		} catch (error) {
			logger.error('Failed to update user profile', error);
			return message(
				form,
				{ type: 'error', text: 'Failed to update profile. Please try again.' },
				{ status: 500 }
			);
		}
	},

	changePassword: async ({ request, locals }) => {
		const currentUser = locals.user;
		const form = await superValidate(request, zod4(changePasswordSchema));
		if (!form.valid) {
			return message(
				form,
				{ type: 'error', text: 'Please correct the errors in the form.' },
				{ status: 400 }
			);
		}

		try {
			await auth.api.changePassword({
				body: {
					currentPassword: form.data.currentPassword,
					newPassword: form.data.newPassword,
					revokeOtherSessions: true
				},
				headers: request.headers
			});

			return message(form, {
				type: 'success',
				text: `Password changed successfully for user ${currentUser.name}.`
			});
		} catch (error) {
			logger.error('Failed to change password', error);
			return message(
				form,
				{ type: 'error', text: 'Current password is incorrect or password change failed.' },
				{ status: 400 }
			);
		}
	}
} satisfies Actions;
