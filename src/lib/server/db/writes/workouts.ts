import { ApiWriteError } from '$lib/server/api/errors';
import type {
	ApiCreateWorkoutInput,
	ApiUpdateWorkoutInput
} from '$lib/server/api/schemas/workouts';
import { getDb } from '$lib/server/db';
import { workoutExercises, workoutLogs } from '$lib/server/db/schema';
import {
	generateId,
	withAuditFieldsForCreate,
	withAuditFieldsForUpdate
} from '$lib/server/db/utils';
import { and, eq } from 'drizzle-orm';

/**
 * Insert path for API-key-driven workout logging, including strength-workout exercises.
 * Mirrors the `logWorkout` action in src/routes/(app)/fitness/+page.server.ts, kept as
 * its own standalone function rather than sharing code with that UI action.
 */
export async function createWorkout(userId: string, input: ApiCreateWorkoutInput) {
	const db = getDb();
	const workoutId = generateId();

	await db.insert(workoutLogs).values({
		id: workoutId,
		userId,
		date: input.date,
		time: input.time ?? null,
		type: input.type,
		durationMinutes: input.durationMinutes ?? null,
		steps: input.steps ?? null,
		notes: input.notes ?? null,
		...withAuditFieldsForCreate()
	});

	if (input.type === 'strength' && input.exercises && input.exercises.length > 0) {
		await db.insert(workoutExercises).values(
			input.exercises
				.filter((exercise) => exercise.exerciseName.trim().length > 0)
				.map((exercise) => ({
					id: generateId(),
					workoutLogId: workoutId,
					exerciseName: exercise.exerciseName,
					sets: exercise.sets ?? null,
					reps: exercise.reps ?? null,
					weightLbs: exercise.weightLbs ?? null,
					...withAuditFieldsForCreate()
				}))
		);
	}

	return getWorkoutWithExercises(userId, workoutId);
}

/**
 * Update path for API-key-driven workout updates. Mirrors the `updateWorkout` action
 * in src/routes/(app)/fitness/+page.server.ts (replace-all-exercises-on-update),
 * kept as its own standalone function rather than sharing code with that UI action.
 */
export async function updateWorkout(
	userId: string,
	workoutId: string,
	input: ApiUpdateWorkoutInput
) {
	const db = getDb();

	const existing = await db.query.workoutLogs.findFirst({
		where: and(eq(workoutLogs.id, workoutId), eq(workoutLogs.userId, userId))
	});

	if (!existing) {
		throw new ApiWriteError('not_found', 'Workout not found.', 404);
	}

	const nextType = input.type ?? existing.type;

	// The better-sqlite3 driver runs transaction callbacks synchronously, so every query
	// inside must use its sync execution method (`.run()`) instead of `await` — an
	// `async` callback throws "Transaction function cannot return a promise" at runtime.
	db.transaction((tx) => {
		tx.update(workoutLogs)
			.set({
				date: input.date ?? existing.date,
				time: input.time !== undefined ? input.time : existing.time,
				type: nextType,
				durationMinutes:
					input.durationMinutes !== undefined ? input.durationMinutes : existing.durationMinutes,
				steps: input.steps !== undefined ? input.steps : existing.steps,
				notes: input.notes !== undefined ? input.notes : existing.notes,
				...withAuditFieldsForUpdate()
			})
			.where(and(eq(workoutLogs.id, workoutId), eq(workoutLogs.userId, userId)))
			.run();

		if (input.exercises !== undefined) {
			tx.delete(workoutExercises).where(eq(workoutExercises.workoutLogId, workoutId)).run();

			if (nextType === 'strength' && input.exercises.length > 0) {
				tx.insert(workoutExercises)
					.values(
						input.exercises
							.filter((exercise) => exercise.exerciseName.trim().length > 0)
							.map((exercise) => ({
								id: generateId(),
								workoutLogId: workoutId,
								exerciseName: exercise.exerciseName,
								sets: exercise.sets ?? null,
								reps: exercise.reps ?? null,
								weightLbs: exercise.weightLbs ?? null,
								...withAuditFieldsForCreate()
							}))
					)
					.run();
			}
		}
	});

	return getWorkoutWithExercises(userId, workoutId);
}

export async function getWorkoutWithExercises(userId: string, workoutId: string) {
	const db = getDb();

	const workout = await db.query.workoutLogs.findFirst({
		where: and(eq(workoutLogs.id, workoutId), eq(workoutLogs.userId, userId))
	});

	if (!workout) {
		throw new ApiWriteError('not_found', 'Workout not found.', 404);
	}

	const exercises = await db.query.workoutExercises.findMany({
		where: eq(workoutExercises.workoutLogId, workoutId)
	});

	return { ...workout, exercises };
}
