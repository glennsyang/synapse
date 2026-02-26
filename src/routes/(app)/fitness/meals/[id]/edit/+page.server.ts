import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { deleteEntrySchema, type MealType, updateMealSchema } from '$lib/schemas/fitness';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { getDb } from '$lib/server/db';
import { mealLogs } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const meal = await getDb().query.mealLogs.findFirst({
		where: and(eq(mealLogs.id, params.id), eq(mealLogs.userId, locals.user!.id))
	});

	if (!meal) {
		throw redirect(303, '/fitness?tab=meals');
	}

	const form = await superValidate(
		{
			id: meal.id,
			date: meal.date,
			timeOfDay: meal.timeOfDay as MealType,
			description: meal.description,
			caloriesEstimate: meal.caloriesEstimate
		},
		zod4(updateMealSchema)
	);

	return {
		meal,
		form
	};
};

export const actions: Actions = {
	update: requireAuth(async ({ request, params }, user) => {
		const mealId = params.id as string;
		const form = await superValidate(request, zod4(updateMealSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const db = getDb();
			const existing = await db.query.mealLogs.findFirst({
				where: and(eq(mealLogs.id, mealId), eq(mealLogs.userId, user.id))
			});

			if (!existing) {
				return fail(404, { form, error: 'Meal not found' });
			}

			await db
				.update(mealLogs)
				.set({
					date: form.data.date,
					timeOfDay: form.data.timeOfDay,
					description: form.data.description,
					caloriesEstimate: form.data.caloriesEstimate || null,
					updatedAt: new Date().toISOString()
				})
				.where(eq(mealLogs.id, mealId));

			logger.info('Meal updated', { mealId, userId: user.id });
		} catch (error) {
			logger.error('Failed to update meal', { error, mealId });
			return fail(500, { form, error: 'Failed to update meal' });
		}

		throw redirect(303, '/fitness?tab=meals&notice=meal-updated');
	}),

	delete: requireAuth(async ({ request, params }, user) => {
		const mealId = params.id as string;
		const form = await superValidate(request, zod4(deleteEntrySchema));

		if (!form.valid || form.data.id !== mealId) {
			return fail(400, { error: 'Invalid meal id' });
		}

		try {
			const db = getDb();
			const existing = await db.query.mealLogs.findFirst({
				where: and(eq(mealLogs.id, mealId), eq(mealLogs.userId, user.id))
			});

			if (!existing) {
				return fail(404, { error: 'Meal not found' });
			}

			await db.delete(mealLogs).where(eq(mealLogs.id, mealId));
			logger.info('Meal deleted', { mealId, userId: user.id });
		} catch (error) {
			logger.error('Failed to delete meal', { error, mealId });
			return fail(500, { error: 'Failed to delete meal' });
		}

		throw redirect(303, '/fitness?tab=meals&notice=meal-deleted');
	})
};
