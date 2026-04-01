import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

import {
	deleteEntrySchema,
	updateWorkoutSchema,
	type WorkoutType,
	workoutExerciseSchema
} from '$lib/schemas/fitness';
import { requireAuth } from '$lib/server/actions/auth-guard';
import {
	getOwnedEntityOrNull,
	getOwnedEntityOrThrow
} from '$lib/server/actions/edit-route-helpers';
import { getDb } from '$lib/server/db';
import { workoutExercises, workoutLogs } from '$lib/server/db/schema';
import { generateId } from '$lib/server/db/utils';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

const exercisesArraySchema = z.array(workoutExerciseSchema);

export const load: PageServerLoad = async ({ locals, params }) => {
	const workout = await getOwnedEntityOrThrow(
		() =>
			getDb().query.workoutLogs.findFirst({
				where: and(eq(workoutLogs.id, params.id), eq(workoutLogs.userId, locals.user?.id)),
				with: {
					exercises: true
				}
			}),
		{ type: 'redirect', to: '/fitness?tab=workouts' }
	);

	const form = await superValidate(
		{
			id: workout.id,
			date: workout.date,
			time: workout.time,
			type: workout.type as WorkoutType,
			durationMinutes: workout.durationMinutes,
			steps: workout.steps,
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
			return fail(400, { form });
		}

		try {
			const db = getDb();
			const existing = await getOwnedEntityOrNull(() =>
				db.query.workoutLogs.findFirst({
					where: and(eq(workoutLogs.id, workoutId), eq(workoutLogs.userId, user.id))
				})
			);

			if (!existing) {
				return fail(404, { form, error: 'Workout not found' });
			}

			let parsedExercises: Array<z.infer<typeof workoutExerciseSchema>> = [];
			if (form.data.type === 'strength') {
				if (form.data.exercises) {
					let exercisesInput: unknown;
					try {
						exercisesInput = JSON.parse(form.data.exercises);
					} catch (error) {
						logger.warn('Invalid exercises JSON during workout update', {
							error,
							workoutId
						});
						return fail(400, { form, error: 'Invalid exercises data' });
					}

					const parsed = exercisesArraySchema.safeParse(exercisesInput);
					if (!parsed.success) {
						return fail(400, { form, error: 'Invalid exercises data' });
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
						steps: form.data.steps || null,
						notes: form.data.notes || null,
						updatedAt: new Date().toISOString()
					})
					.where(and(eq(workoutLogs.id, workoutId), eq(workoutLogs.userId, user.id)));

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
			return fail(500, { form, error: 'Failed to update workout' });
		}

		throw redirect(303, '/fitness?tab=workouts&notice=workout-updated');
	}),

	delete: requireAuth(async ({ request, params }, user) => {
		const workoutId = params.id as string;
		const form = await superValidate(request, zod4(deleteEntrySchema));

		if (!form.valid || form.data.id !== workoutId) {
			return fail(400, { error: 'Invalid workout id' });
		}

		try {
			const db = getDb();
			const existing = await getOwnedEntityOrNull(() =>
				db.query.workoutLogs.findFirst({
					where: and(eq(workoutLogs.id, workoutId), eq(workoutLogs.userId, user.id))
				})
			);

			if (!existing) {
				return fail(404, { error: 'Workout not found' });
			}

			await db
				.delete(workoutLogs)
				.where(and(eq(workoutLogs.id, workoutId), eq(workoutLogs.userId, user.id)));
			logger.info('Workout deleted', { workoutId, userId: user.id });
		} catch (error) {
			logger.error('Failed to delete workout', { error, workoutId });
			return fail(500, { error: 'Failed to delete workout' });
		}

		throw redirect(303, '/fitness?tab=workouts&notice=workout-deleted');
	})
};
