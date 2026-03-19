import { and, desc, eq, gte, sql } from 'drizzle-orm';

import { getDb } from '$lib/server/db';
import { journalEntries, meditationSessions, workoutLogs } from '$lib/server/db/schema';
import {
	addDaysToDateString,
	getRollingDateRange,
	getStartOfWeek,
	getTodayString,
	getWeekDates
} from '$lib/utils/date';
import { logger } from '$lib/utils/logger';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		return {
			stats: {
				journalThisWeek: 0,
				journalLastWeek: 0,
				meditationThisWeek: 0,
				meditationLastWeek: 0,
				workoutsThisWeek: 0,
				workoutsLastWeek: 0,
				workoutsCompletedMonth: 0,
				weeklyActivity: []
			},
			recentJournalEntries: [],
			recentWorkouts: [],
			recentMeditations: []
		};
	}

	const today = getTodayString();
	const startOfThisWeekDate = getStartOfWeek(today);
	const endOfThisWeekDate = addDaysToDateString(startOfThisWeekDate, 7);
	const startOfLastWeekDate = addDaysToDateString(startOfThisWeekDate, -7);
	const startOfMonthDate = addDaysToDateString(today, -30);
	const thisWeekDates = getWeekDates(startOfThisWeekDate);
	const lastWeekDates = getWeekDates(startOfLastWeekDate);
	const rollingWeekDates = getRollingDateRange(today, 7);
	const meditationRangeStartIso = `${addDaysToDateString(startOfLastWeekDate, -1)}T00:00:00.000Z`;
	const meditationRangeEndIso = `${addDaysToDateString(endOfThisWeekDate, 1)}T00:00:00.000Z`;

	const db = getDb();

	try {
		const [
			journalDateCounts,
			workoutDateCounts,
			meditationSessionsInRange,
			workoutCountMonth,
			recentJournalEntries,
			recentWorkouts,
			recentMeditations
		] = await Promise.all([
			db
				.select({
					date: journalEntries.date,
					count: sql<number>`count(*)`
				})
				.from(journalEntries)
				.where(
					and(
						eq(journalEntries.userId, user.id),
						gte(journalEntries.date, startOfLastWeekDate),
						sql`${journalEntries.date} < ${endOfThisWeekDate}`
					)
				)
				.groupBy(journalEntries.date),
			db
				.select({
					date: workoutLogs.date,
					count: sql<number>`count(*)`
				})
				.from(workoutLogs)
				.where(
					and(
						eq(workoutLogs.userId, user.id),
						gte(workoutLogs.date, startOfLastWeekDate),
						sql`${workoutLogs.date} < ${endOfThisWeekDate}`
					)
				)
				.groupBy(workoutLogs.date),
			db
				.select({
					completedAt: meditationSessions.completedAt
				})
				.from(meditationSessions)
				.where(
					and(
						eq(meditationSessions.userId, user.id),
						gte(meditationSessions.completedAt, meditationRangeStartIso),
						sql`${meditationSessions.completedAt} < ${meditationRangeEndIso}`
					)
				),
			db
				.select({ count: sql<number>`count(*)` })
				.from(workoutLogs)
				.where(and(eq(workoutLogs.userId, user.id), gte(workoutLogs.date, startOfMonthDate))),
			db.query.journalEntries.findMany({
				where: eq(journalEntries.userId, user.id),
				orderBy: [desc(journalEntries.createdAt)],
				limit: 3
			}),
			db.query.workoutLogs.findMany({
				where: eq(workoutLogs.userId, user.id),
				orderBy: [desc(workoutLogs.createdAt)],
				limit: 3
			}),
			db.query.meditationSessions.findMany({
				where: eq(meditationSessions.userId, user.id),
				orderBy: [desc(meditationSessions.createdAt)],
				limit: 3,
				with: {
					routine: true
				}
			})
		]);

		const journalCountByDate = new Map<string, number>();
		for (const row of journalDateCounts) {
			journalCountByDate.set(row.date, Number(row.count || 0));
		}

		const workoutCountByDate = new Map<string, number>();
		for (const row of workoutDateCounts) {
			workoutCountByDate.set(row.date, Number(row.count || 0));
		}

		const meditationCountByDate = new Map<string, number>();
		for (const session of meditationSessionsInRange) {
			// Convert the UTC timestamp to app-local date before aggregation.
			const localDate = getTodayString(new Date(session.completedAt));

			if (localDate < startOfLastWeekDate || localDate >= endOfThisWeekDate) {
				continue;
			}

			meditationCountByDate.set(localDate, (meditationCountByDate.get(localDate) ?? 0) + 1);
		}

		const sumCountsByDate = (countByDate: Map<string, number>, dates: string[]): number => {
			return dates.reduce((total, date) => total + (countByDate.get(date) ?? 0), 0);
		};

		const weeklyActivity = rollingWeekDates.map((activityDate) => ({
			date: activityDate,
			journal: journalCountByDate.get(activityDate) ?? 0,
			meditation: meditationCountByDate.get(activityDate) ?? 0,
			workouts: workoutCountByDate.get(activityDate) ?? 0
		}));

		return {
			stats: {
				journalThisWeek: sumCountsByDate(journalCountByDate, thisWeekDates),
				journalLastWeek: sumCountsByDate(journalCountByDate, lastWeekDates),
				meditationThisWeek: sumCountsByDate(meditationCountByDate, thisWeekDates),
				meditationLastWeek: sumCountsByDate(meditationCountByDate, lastWeekDates),
				workoutsThisWeek: sumCountsByDate(workoutCountByDate, thisWeekDates),
				workoutsLastWeek: sumCountsByDate(workoutCountByDate, lastWeekDates),
				workoutsCompletedMonth: Number(workoutCountMonth[0]?.count || 0),
				weeklyActivity
			},
			recentJournalEntries,
			recentWorkouts,
			recentMeditations
		};
	} catch (error) {
		logger.error('Failed to load dashboard data', { error });

		return {
			stats: {
				journalThisWeek: 0,
				journalLastWeek: 0,
				meditationThisWeek: 0,
				meditationLastWeek: 0,
				workoutsThisWeek: 0,
				workoutsLastWeek: 0,
				workoutsCompletedMonth: 0,
				weeklyActivity: []
			},
			recentJournalEntries: [],
			recentWorkouts: [],
			recentMeditations: []
		};
	}
};
