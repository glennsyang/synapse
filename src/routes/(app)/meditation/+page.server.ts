import { fail } from '@sveltejs/kit';
import { and, desc, eq, like, or } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { editSessionSchema, routineFilterSchema } from '$lib/schemas/meditation';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { getDb } from '$lib/server/db';
import { meditationRoutines, meditationSchedules, meditationSessions } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const moodParam = url.searchParams.get('mood');
	const filters = routineFilterSchema.safeParse({
		moods: moodParam
			? moodParam
					.split(',')
					.map((m) => m.trim())
					.filter(Boolean)
			: undefined,
		duration: url.searchParams.get('duration') ?? undefined,
		search: url.searchParams.get('search') ?? undefined
	});

	if (!filters.success) {
		logger.error('Invalid filter parameters', { error: filters.error });
		return {
			routines: [],
			schedules: [],
			sessions: [],
			editSessionForm: await superValidate(zod4(editSessionSchema))
		};
	}

	const { moods, duration, search } = filters.data;

	try {
		const db = getDb();

		// Build conditions for routine query
		const routineConditions = [];

		// Add search filter (title or description)
		if (search?.trim()) {
			const searchTerm = `%${search.trim()}%`;
			routineConditions.push(
				or(
					like(meditationRoutines.title, searchTerm),
					like(meditationRoutines.description, searchTerm)
				)
			);
		}

		// Add mood filter (multi-select OR)
		if (moods && moods.length > 0) {
			const moodConditions = moods.map((mood) => like(meditationRoutines.moodTags, `%"${mood}"%`));
			routineConditions.push(or(...moodConditions));
		}

		// Add duration filter
		if (duration) {
			routineConditions.push(eq(meditationRoutines.durationMinutes, duration));
		}

		// Fetch routines
		const routines = await db.query.meditationRoutines.findMany({
			where: and(...routineConditions)
		});

		// Parse moodTags JSON for each routine
		const parsedRoutines = routines.map((routine) => ({
			...routine,
			moodTags: routine.moodTags ? JSON.parse(routine.moodTags) : []
		}));

		// Fetch all schedules for user
		const schedules = await db.query.meditationSchedules.findMany({
			where: eq(meditationSchedules.userId, locals.user.id),
			with: {
				routine: true
			}
		});

		// Parse daysOfWeek JSON for each schedule
		const parsedSchedules = schedules.map((schedule) => ({
			...schedule,
			daysOfWeek: schedule.daysOfWeek ? JSON.parse(schedule.daysOfWeek) : null
		}));

		// Fetch recent sessions for history
		const sessions = await db.query.meditationSessions.findMany({
			where: eq(meditationSessions.userId, locals.user.id),
			orderBy: [desc(meditationSessions.completedAt)],
			limit: 50,
			with: {
				routine: true
			}
		});

		const editSessionForm = await superValidate(zod4(editSessionSchema));

		return {
			routines: parsedRoutines,
			schedules: parsedSchedules,
			sessions,
			editSessionForm
		};
	} catch (error) {
		logger.error('Failed to load meditation data', { error });
		return {
			routines: [],
			schedules: [],
			sessions: [],
			editSessionForm: await superValidate(zod4(editSessionSchema))
		};
	}
};

export const actions: Actions = {
	updateSession: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(editSessionSchema));

		if (!form.valid) {
			logger.warn('Invalid edit session form data', { errors: form.errors });
			return fail(400, { form });
		}

		try {
			const db = getDb();

			const session = await db.query.meditationSessions.findFirst({
				where: and(eq(meditationSessions.id, form.data.id), eq(meditationSessions.userId, user.id))
			});

			if (!session) {
				return fail(404, { form });
			}

			await db
				.update(meditationSessions)
				.set({
					completedAt: new Date(form.data.completed_at).toISOString(),
					preMoodRating: form.data.pre_mood_rating ?? null,
					moodRating: form.data.mood_rating ?? null,
					notes: form.data.notes || null,
					updatedAt: new Date().toISOString()
				})
				.where(eq(meditationSessions.id, form.data.id));

			logger.info('Meditation session updated', { sessionId: form.data.id, userId: user.id });
			return message(form, { type: 'success', text: 'Session updated successfully!' });
		} catch (err) {
			logger.error('Failed to update session', { error: err });
			return message(
				form,
				{ type: 'error', text: 'An error occurred while updating the session.' },
				{ status: 500 }
			);
		}
	}),

	deleteSession: requireAuth(async ({ request }, user) => {
		const formData = await request.formData();
		const sessionId = formData.get('session_id') as string;

		if (!sessionId) {
			return fail(400, { error: 'Session ID is required' });
		}

		try {
			const db = getDb();

			await db
				.delete(meditationSessions)
				.where(and(eq(meditationSessions.id, sessionId), eq(meditationSessions.userId, user.id)));

			logger.info('Meditation session deleted', { sessionId, userId: user.id });
			return { success: true };
		} catch (err) {
			logger.error('Failed to delete session', { error: err });
			return fail(500, { error: 'Failed to delete session' });
		}
	})
};
