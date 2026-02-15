import { redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

import {
	deleteEntrySchema,
	updateWorkoutSchema,
	workoutExerciseSchema,
	type WorkoutType
} from '$lib/schemas/fitness';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { getDb } from '$lib/server/db';
import { workoutExercises, workoutLogs } from '$lib/server/db/schema';
import { generateId } from '$lib/server/db/utils';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

const exercisesArraySchema = z.array(workoutExerciseSchema);

export const load: PageServerLoad = async ({ locals, params }) => {
	const workout = await getDb().query.workoutLogs.findFirst({
		where: and(eq(workoutLogs.id, params.id), eq(workoutLogs.userId, locals.user!.id)),
		with: {
			exercises: true
		}
	});

	if (!workout) {
		redirect(303, '/fitness?tab=workouts');
	}

	const form = await superValidate(
		{
			id: workout.id,
			date: workout.date,
			time: workout.time,
			type: workout.type as WorkoutType,
			durationMinutes: workout.durationMinutes,
			notes: workout.notes,
			exercises:
				workout.type === 'strength'
					? JSON.stringify(
							workout.exercises.map((exercise) => ({
								exerciseName: exercise.exerciseName,
								sets: exercise.sets,
								reps: exercise.reps,
								weightLbs: exercise.weightLbs
							}))
						)
					: null
		},
		zod4(updateWorkoutSchema)
	);

	return {
		workout,
		form
	};
};

export const actions: Actions = {
	update: requireAuth(async ({ request, params }, user) => {
		const workoutId = params.id as string;
		const form = await superValidate(request, zod4(updateWorkoutSchema));

		if (!form.valid) {
			return { form, status: 400 };
		}

		try {
			const db = getDb();
			const existing = await db.query.workoutLogs.findFirst({
				where: and(eq(workoutLogs.id, workoutId), eq(workoutLogs.userId, user.id))
			});

			if (!existing) {
				return { form, error: 'Workout not found', status: 404 };
			}

			let parsedExercises: Array<z.infer<typeof workoutExerciseSchema>> = [];
			if (form.data.type === 'strength') {
				if (form.data.exercises) {
					let exercisesInput: unknown;
					try {
						exercisesInput = JSON.parse(form.data.exercises);
					} catch (error) {
						logger.warn('Invalid exercises JSON during workout update', { error, workoutId });
						return { form, error: 'Invalid exercises data', status: 400 };
					}

					const parsed = exercisesArraySchema.safeParse(exercisesInput);
					if (!parsed.success) {
						return { form, error: 'Invalid exercises data', status: 400 };
					}

					parsedExercises = parsed.data.filter(
						(exercise) => exercise.exerciseName.trim().length > 0
					);
				}
			}

			await db.transaction(async (tx) => {
				await tx
					.update(workoutLogs)
					.set({
						date: form.data.date,
						time: form.data.time || null,
						type: form.data.type,
						durationMinutes: form.data.durationMinutes || null,
						notes: form.data.notes || null,
						updatedAt: new Date().toISOString()
					})
					.where(eq(workoutLogs.id, workoutId));

				await tx.delete(workoutExercises).where(eq(workoutExercises.workoutLogId, workoutId));

				if (form.data.type === 'strength' && parsedExercises.length > 0) {
					await tx.insert(workoutExercises).values(
						parsedExercises.map((exercise) => ({
							id: generateId(),
							workoutLogId: workoutId,
							exerciseName: exercise.exerciseName,
							sets: exercise.sets || null,
							reps: exercise.reps || null,
							weightLbs: exercise.weightLbs || null,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString()
						}))
					);
				}
			});

			logger.info('Workout updated', { workoutId, userId: user.id });
		} catch (error) {
			logger.error('Failed to update workout', { error, workoutId });
			return { form, error: 'Failed to update workout', status: 500 };
		}

		throw redirect(303, '/fitness?tab=workouts&notice=workout-updated');
	}),

	delete: requireAuth(async ({ request, params }, user) => {
		const workoutId = params.id as string;
		const form = await superValidate(request, zod4(deleteEntrySchema));

		if (!form.valid || form.data.id !== workoutId) {
			return { error: 'Invalid workout id', status: 400 };
		}

		try {
			const db = getDb();
			const existing = await db.query.workoutLogs.findFirst({
				where: and(eq(workoutLogs.id, workoutId), eq(workoutLogs.userId, user.id))
			});

			if (!existing) {
				return { error: 'Workout not found', status: 404 };
			}

			await db.delete(workoutLogs).where(eq(workoutLogs.id, workoutId));
			logger.info('Workout deleted', { workoutId, userId: user.id });
		} catch (error) {
			logger.error('Failed to delete workout', { error, workoutId });
			return { error: 'Failed to delete workout', status: 500 };
		}

		throw redirect(303, '/fitness?tab=workouts&notice=workout-deleted');
	})
};
