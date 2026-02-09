import { and, desc, eq, isNull, or } from 'drizzle-orm';

import { routineFilterSchema } from '$lib/schemas/meditation';
import { getDb } from '$lib/server/db';
import { meditationRoutines, meditationSchedules, meditationSessions } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Auth handled by (app)/+layout.server.ts

	const filters = routineFilterSchema.safeParse({
		mood: url.searchParams.get('mood') ?? undefined,
		type: url.searchParams.get('type') ?? undefined
	});

	if (!filters.success) {
		logger.error('Invalid filter parameters', { error: filters.error });
		return {
			routines: [],
			schedules: [],
			sessions: []
		};
	}

	const { mood, type } = filters.data;

	try {
		const db = getDb();

		// Build conditions for routine query
		const routineConditions = [];

		if (type === 'predefined') {
			routineConditions.push(isNull(meditationRoutines.userId));
		} else if (type === 'user-created') {
			routineConditions.push(eq(meditationRoutines.userId, locals.user.id));
		} else {
			// 'all' - show both predefined and user-created
			routineConditions.push(
				or(isNull(meditationRoutines.userId), eq(meditationRoutines.userId, locals.user!.id))!
			);
		}

		// Add mood filter if specified
		if (mood) {
			// Search for mood tag in JSON array
			routineConditions.push(eq(meditationRoutines.moodTags, `%"${mood}"%`));
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

		return {
			routines: parsedRoutines,
			schedules: parsedSchedules,
			sessions
		};
	} catch (error) {
		logger.error('Failed to load meditation data', { error });
		return {
			routines: [],
			schedules: [],
			sessions: []
		};
	}
};
