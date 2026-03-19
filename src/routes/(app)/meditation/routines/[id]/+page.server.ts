import { error, fail, isHttpError, isRedirect, redirect } from '@sveltejs/kit';
import { and, desc, eq, or } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import {
	completeSessionSchema,
	scheduleSchema,
	updateRoutineSchema
} from '$lib/schemas/meditation';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { splitCommaSeparated } from '$lib/server/actions/string-parsers';
import { getDb } from '$lib/server/db';
import { meditationRoutines, meditationSchedules, meditationSessions } from '$lib/server/db/schema';
import { generateId } from '$lib/server/db/utils';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		logger.warn('Unauthorized access attempt to meditation routine page');
		throw redirect(302, '/sign-in');
	}

	try {
		const db = getDb();

		// Fetch routine
		const routine = await db.query.meditationRoutines.findFirst({
			where: and(
				eq(meditationRoutines.id, params.id),
				or(eq(meditationRoutines.userId, locals.user.id), eq(meditationRoutines.isPredefined, true))
			)
		});

		if (!routine) {
			throw error(404, 'Routine not found');
		}

		// Check permissions for user-created routines
		if (!routine.isPredefined && routine.userId !== locals.user.id) {
			throw error(403, 'Unauthorized to view this routine');
		}

		// Fetch schedule for this routine (if exists)
		const schedule = await db.query.meditationSchedules.findFirst({
			where: and(
				eq(meditationSchedules.routineId, params.id),
				eq(meditationSchedules.userId, locals.user.id)
			)
		});

		// Fetch sessions for this routine
		const sessions = await db.query.meditationSessions.findMany({
			where: and(
				eq(meditationSessions.routineId, params.id),
				eq(meditationSessions.userId, locals.user.id)
			),
			orderBy: [desc(meditationSessions.completedAt)],
			limit: 20
		});

		// Parse JSON fields
		const parsedRoutine = {
			...routine,
			moodTags: routine.moodTags ? JSON.parse(routine.moodTags) : []
		};

		const parsedSchedule = schedule
			? {
					...schedule,
					daysOfWeek: schedule.daysOfWeek ? JSON.parse(schedule.daysOfWeek) : null
				}
			: null;

		// Initialize forms
		const scheduleForm = schedule
			? await superValidate(
					{
						cadence: schedule.cadence as 'daily' | 'weekly' | 'custom',
						days_of_week: schedule.daysOfWeek || '',
						time: schedule.time
					},
					zod4(scheduleSchema)
				)
			: await superValidate(zod4(scheduleSchema));

		const sessionForm = await superValidate(zod4(completeSessionSchema));

		const updateForm = await superValidate(
			{
				title: routine.title,
				description: routine.description || '',
				link_url: routine.linkUrl,
				duration_minutes: routine.durationMinutes,
				mood_tags: parsedRoutine.moodTags.join(', ')
			},
			zod4(updateRoutineSchema)
		);

		return {
			routine: parsedRoutine,
			schedule: parsedSchedule,
			sessions,
			scheduleForm,
			sessionForm,
			updateForm
		};
	} catch (err) {
		if (isHttpError(err) || isRedirect(err)) {
			throw err;
		}
		logger.error('Failed to load meditation routine', { error: err });
		throw error(500, 'Failed to load routine');
	}
};

export const actions: Actions = {
	createSchedule: requireAuth(async ({ request, locals, params }, user) => {
		const form = await superValidate(request, zod4(scheduleSchema));
		const routineId = params.id;

		if (!form.valid) {
			logger.warn('Invalid schedule form data', { errors: form.errors });
			return fail(400, { form });
		}

		if (!routineId) {
			logger.warn('Missing routine ID in createSchedule action', { userId: user.id });
			return fail(400, { form });
		}

		try {
			const db = getDb();

			// Parse days_of_week if provided
			const daysOfWeekJson = form.data.days_of_week
				? JSON.stringify(
						splitCommaSeparated(form.data.days_of_week)
							.map((d) => Number.parseInt(d.trim(), 10))
							.filter((d) => !Number.isNaN(d) && d >= 0 && d <= 6)
					)
				: null;

			// Check if schedule already exists
			const existingSchedule = await db.query.meditationSchedules.findFirst({
				where: and(
					eq(meditationSchedules.routineId, routineId),
					eq(meditationSchedules.userId, user.id)
				)
			});

			if (existingSchedule) {
				// Update existing schedule
				await db
					.update(meditationSchedules)
					.set({
						cadence: form.data.cadence,
						daysOfWeek: daysOfWeekJson,
						time: form.data.time,
						enabled: true,
						updatedAt: new Date().toISOString()
					})
					.where(eq(meditationSchedules.id, existingSchedule.id));

				logger.info('Meditation schedule updated', {
					scheduleId: existingSchedule.id,
					userId: locals.user.id
				});
			} else {
				// Create new schedule
				const scheduleId = generateId();

				await db.insert(meditationSchedules).values({
					id: scheduleId,
					userId: locals.user.id,
					routineId,
					cadence: form.data.cadence,
					daysOfWeek: daysOfWeekJson,
					time: form.data.time,
					enabled: true,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});

				logger.info('Meditation schedule created', {
					scheduleId,
					userId: locals.user.id
				});
			}

			return message(form, {
				type: 'success',
				text: 'Schedule saved successfully!'
			});
		} catch (error) {
			logger.error('Failed to create/update schedule', { error });
			return message(
				form,
				{
					type: 'error',
					text: 'An error occurred while saving the schedule. Please try again.'
				},
				{ status: 500 }
			);
		}
	}),

	deleteSchedule: requireAuth(async ({ params }, user) => {
		const routineId = params.id;

		if (!routineId) {
			logger.warn('Missing routine ID in deleteSchedule action', { userId: user.id });
			return fail(400, { error: 'Routine ID is required' });
		}

		try {
			const db = getDb();

			await db
				.delete(meditationSchedules)
				.where(
					and(eq(meditationSchedules.routineId, routineId), eq(meditationSchedules.userId, user.id))
				);

			logger.info('Meditation schedule deleted', {
				routineId: routineId,
				userId: user.id
			});
			return { success: true };
		} catch (error) {
			logger.error('Failed to delete schedule', { error });
			return fail(500, { error: 'Failed to delete schedule' });
		}
	}),

	completeSession: requireAuth(async ({ request, params }, user) => {
		const routineId = params.id as string;
		const form = await superValidate(request, zod4(completeSessionSchema));

		if (!form.valid) {
			logger.warn('Invalid session form data', { errors: form.errors });
			return fail(400, { form });
		}

		try {
			const sessionId = generateId();

			await getDb()
				.insert(meditationSessions)
				.values({
					id: sessionId,
					userId: user.id,
					routineId: routineId,
					completedAt: new Date().toISOString(),
					moodRating: form.data.mood_rating || null,
					notes: form.data.notes || null,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});

			logger.info('Meditation session completed', {
				sessionId,
				userId: user.id
			});
			return message(form, {
				type: 'success',
				text: 'Session logged successfully!'
			});
		} catch (error) {
			logger.error('Failed to complete session', { error });
			return message(
				form,
				{
					type: 'error',
					text: 'An error occurred while logging the session. Please try again.'
				},
				{ status: 500 }
			);
		}
	}),

	updateRoutine: requireAuth(async ({ request, params }, user) => {
		const routineId = params.id as string;
		const form = await superValidate(request, zod4(updateRoutineSchema));

		if (!form.valid) {
			logger.warn('Invalid update routine form data', { errors: form.errors });
			return fail(400, { form });
		}

		try {
			const db = getDb();

			// Check if routine exists and user owns it
			const routine = await db.query.meditationRoutines.findFirst({
				where: and(eq(meditationRoutines.id, routineId), eq(meditationRoutines.userId, user.id))
			});

			if (!routine) {
				return fail(404, { error: 'Routine not found' });
			}

			if (routine.isPredefined || routine.userId !== user.id) {
				return fail(403, { error: 'Cannot edit this routine' });
			}

			// Parse mood tags
			const moodTagsJson = JSON.stringify(splitCommaSeparated(form.data.mood_tags));

			await db
				.update(meditationRoutines)
				.set({
					title: form.data.title,
					description: form.data.description || null,
					linkUrl: form.data.link_url,
					durationMinutes: form.data.duration_minutes,
					moodTags: moodTagsJson,
					updatedAt: new Date().toISOString()
				})
				.where(eq(meditationRoutines.id, routineId));

			logger.info('Meditation routine updated', {
				routineId: routineId,
				userId: user.id
			});
			return message(form, {
				type: 'success',
				text: 'Routine updated successfully!'
			});
		} catch (error) {
			logger.error('Failed to update routine', { error });
			return message(
				form,
				{
					type: 'error',
					text: 'An error occurred while updating the routine. Please try again.'
				},
				{ status: 500 }
			);
		}
	}),

	deleteRoutine: requireAuth(async ({ params }, user) => {
		const routineId = params.id as string;

		try {
			const db = getDb();

			// Check if routine exists and user owns it
			const routine = await db.query.meditationRoutines.findFirst({
				where: and(eq(meditationRoutines.id, routineId), eq(meditationRoutines.userId, user.id))
			});

			if (!routine) {
				return fail(404, { error: 'Routine not found' });
			}

			if (routine.isPredefined || routine.userId !== user.id) {
				return fail(403, { error: 'Cannot delete this routine' });
			}

			await db.delete(meditationRoutines).where(eq(meditationRoutines.id, routineId));

			logger.info('Meditation routine deleted', {
				routineId: routineId,
				userId: user.id
			});
		} catch (error) {
			logger.error('Failed to delete routine', { error });
			return fail(500, { error: 'Failed to delete routine' });
		}

		throw redirect(303, '/meditation');
	})
};
