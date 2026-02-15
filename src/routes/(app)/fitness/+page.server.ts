import { desc, eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import {
	logMealSchema,
	logWeightSchema,
	logWorkoutSchema,
	setCalorieTargetSchema,
	setGoalWeightSchema,
	updateWorkoutReminderSchema,
	workoutReminderSchema
} from '$lib/schemas/fitness';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { getDb } from '$lib/server/db';
import {
	dailyCalorieTargets,
	goalWeights,
	mealLogs,
	weightEntries,
	workoutLogs,
	workoutReminders
} from '$lib/server/db/schema';
import { generateId } from '$lib/server/db/utils';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const tab = (() => {
		const tabParam = url.searchParams.get('tab');
		if (tabParam === 'workouts' || tabParam === 'meals' || tabParam === 'reminders') {
			return tabParam;
		}

		return 'weight';
	})();

	// Load up all the forms
	const calorieForm = await superValidate(zod4(setCalorieTargetSchema));
	const weightForm = await superValidate(zod4(logWeightSchema));
	const goalForm = await superValidate(zod4(setGoalWeightSchema));
	const workoutForm = await superValidate(zod4(logWorkoutSchema));
	const mealForm = await superValidate(zod4(logMealSchema));
	const reminderForm = await superValidate(zod4(workoutReminderSchema));

	const userId = locals.user!.id;
	const db = getDb();

	try {
		// Load weight entries
		const weights = await db.query.weightEntries.findMany({
			where: eq(weightEntries.userId, userId),
			orderBy: [desc(weightEntries.date), desc(weightEntries.time)]
		});

		// Load goal weight
		const goalWeight = await db.query.goalWeights.findFirst({
			where: eq(goalWeights.userId, userId)
		});

		// Load workouts (limited to recent)
		const workouts = await db.query.workoutLogs.findMany({
			where: eq(workoutLogs.userId, userId),
			orderBy: [desc(workoutLogs.date), desc(workoutLogs.time)],
			limit: 50,
			with: {
				exercises: true
			}
		});

		// Load meals (limited to recent)
		const meals = await db.query.mealLogs.findMany({
			where: eq(mealLogs.userId, userId),
			orderBy: [desc(mealLogs.date)],
			limit: 50
		});

		// Load calorie target
		const calorieTarget = await db.query.dailyCalorieTargets.findFirst({
			where: eq(dailyCalorieTargets.userId, userId)
		});

		// Load workout reminders
		const reminders = await db.query.workoutReminders.findMany({
			where: eq(workoutReminders.userId, userId),
			orderBy: [desc(workoutReminders.createdAt)]
		});

		// Calculate weight stats
		const currentWeight = weights.length > 0 ? weights[0].weightLbs : null;
		const startWeight = weights.length > 0 ? weights[weights.length - 1].weightLbs : null;
		const remainingToGoal =
			currentWeight && goalWeight ? currentWeight - goalWeight.targetWeightLbs : null;

		// Calculate trend (simple comparison of last 2 entries)
		let trend: 'up' | 'down' | 'stable' = 'stable';
		if (weights.length >= 2) {
			const diff = weights[0].weightLbs - weights[1].weightLbs;
			if (diff < -0.5) trend = 'down';
			else if (diff > 0.5) trend = 'up';
		}

		return {
			tab,
			reminders,
			weightEntries: weights,
			goalWeight,
			workouts,
			meals,
			calorieTarget,
			weightStats: {
				currentWeight,
				startWeight,
				remainingToGoal,
				trend
			},
			calorieForm,
			weightForm,
			goalForm,
			workoutForm,
			mealForm,
			reminderForm
		};
	} catch (error) {
		logger.error('Failed to load fitness data', { error });
		return {
			tab,
			reminders: [],
			weightEntries: [],
			goalWeight: null,
			workouts: [],
			meals: [],
			calorieTarget: null,
			weightStats: {
				currentWeight: null,
				startWeight: null,
				remainingToGoal: null,
				trend: 'stable'
			},
			calorieForm,
			weightForm,
			goalForm,
			workoutForm,
			mealForm,
			reminderForm
		};
	}
};

export const actions: Actions = {
	logWeight: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(logWeightSchema));

		if (!form.valid) {
			logger.warn('Invalid weight log form data', { errors: form.errors });
			return { form, status: 400 };
		}

		try {
			const db = getDb();
			const entryId = generateId();

			await db.insert(weightEntries).values({
				id: entryId,
				userId: user.id,
				date: form.data.date,
				time: form.data.time || null,
				weightLbs: form.data.weightLbs,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});

			logger.info('Weight entry logged', { entryId, userId: user.id });
		} catch (error) {
			logger.error('Failed to log weight entry', { error });
			return message(
				form,
				{
					type: 'error',
					text: 'Failed to log weight entry. Please try again.'
				},
				{ status: 500 }
			);
		}

		return message(form, { type: 'success', text: 'Weight logged successfully!' });
	}),

	setGoal: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(setGoalWeightSchema));

		if (!form.valid) {
			logger.warn('Invalid goal weight form data', { errors: form.errors });
			return { form, status: 400 };
		}

		try {
			const db = getDb();

			// Upsert goal weight (replace existing)
			const existing = await db.query.goalWeights.findFirst({
				where: eq(goalWeights.userId, user.id)
			});

			if (existing) {
				await db
					.update(goalWeights)
					.set({
						targetWeightLbs: form.data.targetWeightLbs,
						setDate: new Date().toISOString().split('T')[0],
						updatedAt: new Date().toISOString()
					})
					.where(eq(goalWeights.userId, user.id));
			} else {
				await db.insert(goalWeights).values({
					id: generateId(),
					userId: user.id,
					targetWeightLbs: form.data.targetWeightLbs,
					setDate: new Date().toISOString().split('T')[0],
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});
			}

			logger.info('Goal weight set', { userId: user.id });
		} catch (error) {
			logger.error('Failed to set goal weight', { error });
			return message(
				form,
				{
					type: 'error',
					text: 'Failed to set goal weight. Please try again.'
				},
				{ status: 500 }
			);
		}

		return message(form, { type: 'success', text: 'Goal weight set successfully!' });
	}),

	logWorkout: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(logWorkoutSchema));

		if (!form.valid) {
			logger.warn('Invalid workout log form data', { errors: form.errors });
			return { form, status: 400 };
		}

		try {
			const db = getDb();
			const workoutId = generateId();

			await db.insert(workoutLogs).values({
				id: workoutId,
				userId: user.id,
				date: form.data.date,
				time: form.data.time || null,
				type: form.data.type,
				durationMinutes: form.data.durationMinutes || null,
				notes: form.data.notes || null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});

			// Handle exercises for strength workouts
			if (form.data.type === 'strength' && form.data.exercises) {
				try {
					const exercises = JSON.parse(form.data.exercises);
					if (Array.isArray(exercises)) {
						const { workoutExercises } = await import('$lib/server/db/schema');

						for (const exercise of exercises) {
							if (exercise.exerciseName) {
								await db.insert(workoutExercises).values({
									id: generateId(),
									workoutLogId: workoutId,
									exerciseName: exercise.exerciseName,
									sets: exercise.sets || null,
									reps: exercise.reps || null,
									weightLbs: exercise.weightLbs || null,
									createdAt: new Date().toISOString(),
									updatedAt: new Date().toISOString()
								});
							}
						}
					}
				} catch (parseError) {
					logger.warn('Failed to parse exercises JSON', { error: parseError });
				}
			}

			logger.info('Workout logged', { workoutId, userId: user.id });
		} catch (error) {
			logger.error('Failed to log workout', { error });
			return message(
				form,
				{
					type: 'error',
					text: 'Failed to log workout. Please try again.'
				},
				{ status: 500 }
			);
		}

		return message(form, { type: 'success', text: 'Workout logged successfully!' });
	}),

	logMeal: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(logMealSchema));

		if (!form.valid) {
			logger.warn('Invalid meal log form data', { errors: form.errors });
			return { form, status: 400 };
		}

		try {
			const db = getDb();
			const mealId = generateId();

			await db.insert(mealLogs).values({
				id: mealId,
				userId: user.id,
				date: form.data.date,
				timeOfDay: form.data.timeOfDay,
				description: form.data.description,
				caloriesEstimate: form.data.caloriesEstimate || null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});

			logger.info('Meal logged', { mealId, userId: user.id });
		} catch (error) {
			logger.error('Failed to log meal', { error });
			return message(
				form,
				{
					type: 'error',
					text: 'Failed to log meal. Please try again.'
				},
				{ status: 500 }
			);
		}

		return message(form, { type: 'success', text: 'Meal logged successfully!' });
	}),

	setCalorieTarget: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(setCalorieTargetSchema));

		if (!form.valid) {
			logger.warn('Invalid calorie target form data', { errors: form.errors });
			return { form, status: 400 };
		}

		try {
			const db = getDb();

			// Upsert calorie target (replace existing)
			const existing = await db.query.dailyCalorieTargets.findFirst({
				where: eq(dailyCalorieTargets.userId, user.id)
			});

			if (existing) {
				await db
					.update(dailyCalorieTargets)
					.set({
						targetCalories: form.data.targetCalories,
						setDate: new Date().toISOString().split('T')[0],
						updatedAt: new Date().toISOString()
					})
					.where(eq(dailyCalorieTargets.userId, user.id));
			} else {
				await db.insert(dailyCalorieTargets).values({
					id: generateId(),
					userId: user.id,
					targetCalories: form.data.targetCalories,
					setDate: new Date().toISOString().split('T')[0],
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});
			}

			logger.info('Calorie target set', { userId: user.id });
		} catch (error) {
			logger.error('Failed to set calorie target', { error });
			return message(
				form,
				{
					type: 'error',
					text: 'Failed to set calorie target. Please try again.'
				},
				{ status: 500 }
			);
		}
	}),

	createReminder: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(workoutReminderSchema));

		if (!form.valid) {
			logger.warn('Invalid workout reminder form data', { errors: form.errors });
			return { form, status: 400 };
		}

		try {
			const db = getDb();
			const reminderId = generateId();

			await db.insert(workoutReminders).values({
				id: reminderId,
				userId: user.id,
				workoutType: form.data.workoutType,
				cadence: form.data.cadence,
				daysOfWeek: form.data.daysOfWeek || null,
				time: form.data.time,
				enabled: form.data.enabled,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});

			logger.info('Workout reminder created', { reminderId, userId: user.id });
		} catch (error) {
			logger.error('Failed to create workout reminder', { error });
			return message(
				form,
				{
					type: 'error',
					text: 'Failed to create reminder. Please try again.'
				},
				{ status: 500 }
			);
		}

		return message(form, { type: 'success', text: 'Reminder created successfully!' });
	}),

	updateReminder: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(updateWorkoutReminderSchema));

		if (!form.valid) {
			logger.warn('Invalid workout reminder update form data', { errors: form.errors });
			return { form, status: 400 };
		}

		try {
			const db = getDb();

			// Verify ownership
			const existing = await db.query.workoutReminders.findFirst({
				where: eq(workoutReminders.id, form.data.id)
			});

			if (!existing || existing.userId !== user.id) {
				return message(
					form,
					{
						type: 'error',
						text: 'Reminder not found or access denied.'
					},
					{ status: 404 }
				);
			}

			await db
				.update(workoutReminders)
				.set({
					workoutType: form.data.workoutType,
					cadence: form.data.cadence,
					daysOfWeek: form.data.daysOfWeek || null,
					time: form.data.time,
					enabled: form.data.enabled,
					updatedAt: new Date().toISOString()
				})
				.where(eq(workoutReminders.id, form.data.id));

			logger.info('Workout reminder updated', { reminderId: form.data.id, userId: user.id });
		} catch (error) {
			logger.error('Failed to update workout reminder', { error });
			return message(
				form,
				{
					type: 'error',
					text: 'Failed to update reminder. Please try again.'
				},
				{ status: 500 }
			);
		}

		return message(form, { type: 'success', text: 'Reminder updated successfully!' });
	}),

	deleteReminder: requireAuth(async ({ request }, user) => {
		const formData = await request.formData();
		const reminderId = formData.get('id') as string;

		if (!reminderId) {
			return { success: false, error: 'Reminder ID is required' };
		}

		try {
			const db = getDb();

			// Verify ownership
			const existing = await db.query.workoutReminders.findFirst({
				where: eq(workoutReminders.id, reminderId)
			});

			if (!existing || existing.userId !== user.id) {
				return { success: false, error: 'Reminder not found or access denied' };
			}

			await db.delete(workoutReminders).where(eq(workoutReminders.id, reminderId));

			logger.info('Workout reminder deleted', { reminderId, userId: user.id });
			return { success: true };
		} catch (error) {
			logger.error('Failed to delete workout reminder', { error });
			return { success: false, error: 'Failed to delete reminder. Please try again.' };
		}
	})
};
