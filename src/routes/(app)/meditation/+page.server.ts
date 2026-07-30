import { logger } from '$lib';
import { editSessionSchema, routineFilterSchema } from '$lib/schemas/meditation';
import { getUser, requireAuth } from '$lib/server/actions/auth-guard';
import {
	handleDeleteSession,
	handleUpdateSession
} from '$lib/server/actions/meditation-session-actions';
import { getDb } from '$lib/server/db';
import { meditationRoutines, meditationSchedules, meditationSessions } from '$lib/server/db/schema';
import { safeParse } from '$lib/utils';
import { and, desc, eq, like, or } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

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
		logger.error('Invalid filter parameters', filters.error);
		return {
			routines: [],
			schedules: [],
			sessions: [],
			editSessionForm: await superValidate(zod4(editSessionSchema))
		};
	}

	const { moods, duration, search } = filters.data;
	const userId = getUser(locals).id;

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
			moodTags: safeParse<string[]>(routine.moodTags, [])
		}));

		// Fetch all schedules for user
		const schedules = await db.query.meditationSchedules.findMany({
			where: eq(meditationSchedules.userId, userId),
			with: {
				routine: true
			}
		});

		// Parse daysOfWeek JSON for each schedule
		const parsedSchedules = schedules.map((schedule) => ({
			...schedule,
			daysOfWeek: safeParse<number[] | null>(schedule.daysOfWeek, null)
		}));

		// Fetch recent sessions for history
		const sessions = await db.query.meditationSessions.findMany({
			where: eq(meditationSessions.userId, userId),
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
		logger.error('Failed to load meditation data', error);
		return {
			routines: [],
			schedules: [],
			sessions: [],
			editSessionForm: await superValidate(zod4(editSessionSchema))
		};
	}
};

export const actions = {
	updateSession: requireAuth(async ({ request }, user) => handleUpdateSession(request, user.id)),

	deleteSession: requireAuth(async ({ request }, user) => handleDeleteSession(request, user.id))
} satisfies Actions;
