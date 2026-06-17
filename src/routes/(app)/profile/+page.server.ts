import {
	changePasswordSchema,
	updateProfileSchema,
	updateVisitStatusSettingsSchema
} from '$lib/schemas/auth';
import { getUser, requireAuth } from '$lib/server/actions/auth-guard';
import { auth } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { account, user, visitStatusSettings } from '$lib/server/db/schema';
import { generateId } from '$lib/server/db/utils';
import { getVisitStatusThresholdsForUser } from '$lib/server/visit-status-settings';
import { logger } from '$lib/utils/logger';
import {
	convertVisitThresholdToDays,
	normalizeVisitStatusThresholds
} from '$lib/utils/visit-status';
import { eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const db = getDb();
	const userId = getUser(locals).id;

	// Get the full user data including updatedAt
	const fullUserData = await db.query.user.findFirst({
		where: eq(user.id, userId)
	});

	// Get the account data to find when password was last updated
	const accountData = await db.query.account.findFirst({
		where: eq(account.userId, userId)
	});

	const visitThresholds = await getVisitStatusThresholdsForUser(userId, db);

	// Initialize profile form with current user data
	const profileForm = await superValidate(
		{ name: fullUserData?.name || '' },
		zod4(updateProfileSchema)
	);
	const passwordForm = await superValidate(zod4(changePasswordSchema));
	const visitSettingsForm = await superValidate(
		{
			thresholdUnit: 'days',
			recentToOverdueValue: visitThresholds.recentToOverdueDays,
			overdueToCriticalValue: visitThresholds.overdueToCriticalDays
		},
		zod4(updateVisitStatusSettingsSchema)
	);

	return {
		user: fullUserData || locals.user,
		profileForm,
		passwordForm,
		visitSettingsForm,
		visitThresholds,
		passwordUpdatedAt: accountData?.updatedAt || null
	};
};

export const actions: Actions = {
	update: requireAuth(async ({ request }, currentUser) => {
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
	}),

	changePassword: requireAuth(async ({ request }, currentUser) => {
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
	}),

	updateVisitSettings: requireAuth(async ({ request }, currentUser) => {
		const form = await superValidate(request, zod4(updateVisitStatusSettingsSchema));

		if (!form.valid) {
			return message(
				form,
				{ type: 'error', text: 'Please correct the errors in the form.' },
				{ status: 400 }
			);
		}

		try {
			const db = getDb();
			const rawRecentDays = convertVisitThresholdToDays(
				form.data.recentToOverdueValue,
				form.data.thresholdUnit
			);
			const rawCriticalDays = convertVisitThresholdToDays(
				form.data.overdueToCriticalValue,
				form.data.thresholdUnit
			);

			const normalizedThresholds = normalizeVisitStatusThresholds({
				recentToOverdueDays: rawRecentDays,
				overdueToCriticalDays: rawCriticalDays
			});

			const existing = await db.query.visitStatusSettings.findFirst({
				where: eq(visitStatusSettings.userId, currentUser.id)
			});

			if (existing) {
				await db
					.update(visitStatusSettings)
					.set({
						recentToOverdueDays: normalizedThresholds.recentToOverdueDays,
						overdueToCriticalDays: normalizedThresholds.overdueToCriticalDays,
						updatedAt: new Date().toISOString()
					})
					.where(eq(visitStatusSettings.userId, currentUser.id));
			} else {
				await db.insert(visitStatusSettings).values({
					id: generateId(),
					userId: currentUser.id,
					recentToOverdueDays: normalizedThresholds.recentToOverdueDays,
					overdueToCriticalDays: normalizedThresholds.overdueToCriticalDays,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});
			}

			logger.info('Visit status settings updated', {
				userId: currentUser.id,
				recentToOverdueDays: normalizedThresholds.recentToOverdueDays,
				overdueToCriticalDays: normalizedThresholds.overdueToCriticalDays
			});

			return message(form, {
				type: 'success',
				text: 'Visit settings updated successfully.'
			});
		} catch (error) {
			logger.error('Failed to update visit settings', error);
			return message(
				form,
				{ type: 'error', text: 'Failed to update visit settings. Please try again.' },
				{ status: 500 }
			);
		}
	})
} satisfies Actions;
