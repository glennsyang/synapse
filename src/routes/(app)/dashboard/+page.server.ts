import { and, desc, eq, gte, sql } from 'drizzle-orm';

import { getDb } from '$lib/server/db';
import { journalEntries, meditationSessions, workoutLogs } from '$lib/server/db/schema';
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

	const today = new Date();

	// Calculate current week (Monday to Sunday)
	const dayOfWeek = today.getDay();
	const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday is 0, we want Monday as 0

	const startOfThisWeek = new Date(today);
	startOfThisWeek.setDate(today.getDate() - daysFromMonday);
	startOfThisWeek.setHours(0, 0, 0, 0);

	const endOfThisWeek = new Date(startOfThisWeek);
	endOfThisWeek.setDate(startOfThisWeek.getDate() + 7);

	// Calculate previous week (Monday to Sunday)
	const startOfLastWeek = new Date(startOfThisWeek);
	startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

	const endOfLastWeek = new Date(startOfThisWeek);

	const startOfMonth = new Date(today);
	startOfMonth.setDate(today.getDate() - 30);

	const db = getDb();

	try {
		// This week counts
		const journalCountThisWeek = await db
			.select({ count: sql<number>`count(*)` })
			.from(journalEntries)
			.where(
				and(
					eq(journalEntries.userId, user.id),
					gte(journalEntries.date, startOfThisWeek.toISOString().split('T')[0]),
					sql`${journalEntries.date} < ${endOfThisWeek.toISOString().split('T')[0]}`
				)
			);

		const workoutCountThisWeek = await db
			.select({ count: sql<number>`count(*)` })
			.from(workoutLogs)
			.where(
				and(
					eq(workoutLogs.userId, user.id),
					gte(workoutLogs.date, startOfThisWeek.toISOString().split('T')[0]),
					sql`${workoutLogs.date} < ${endOfThisWeek.toISOString().split('T')[0]}`
				)
			);

		const meditationCountThisWeek = await db
			.select({ count: sql<number>`count(*)` })
			.from(meditationSessions)
			.where(
				and(
					eq(meditationSessions.userId, user.id),
					gte(meditationSessions.completedAt, startOfThisWeek.toISOString()),
					sql`${meditationSessions.completedAt} < ${endOfThisWeek.toISOString()}`
				)
			);

		// Last week counts
		const journalCountLastWeek = await db
			.select({ count: sql<number>`count(*)` })
			.from(journalEntries)
			.where(
				and(
					eq(journalEntries.userId, user.id),
					gte(journalEntries.date, startOfLastWeek.toISOString().split('T')[0]),
					sql`${journalEntries.date} < ${endOfLastWeek.toISOString().split('T')[0]}`
				)
			);

		const workoutCountLastWeek = await db
			.select({ count: sql<number>`count(*)` })
			.from(workoutLogs)
			.where(
				and(
					eq(workoutLogs.userId, user.id),
					gte(workoutLogs.date, startOfLastWeek.toISOString().split('T')[0]),
					sql`${workoutLogs.date} < ${endOfLastWeek.toISOString().split('T')[0]}`
				)
			);

		const meditationCountLastWeek = await db
			.select({ count: sql<number>`count(*)` })
			.from(meditationSessions)
			.where(
				and(
					eq(meditationSessions.userId, user.id),
					gte(meditationSessions.completedAt, startOfLastWeek.toISOString()),
					sql`${meditationSessions.completedAt} < ${endOfLastWeek.toISOString()}`
				)
			);

		const workoutCountMonth = await db
			.select({ count: sql<number>`count(*)` })
			.from(workoutLogs)
			.where(
				and(
					eq(workoutLogs.userId, user.id),
					gte(workoutLogs.date, startOfMonth.toISOString().split('T')[0])
				)
			);

		const weeklyActivity = [];
		for (let i = 6; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(today.getDate() - i);
			date.setHours(0, 0, 0, 0);
			const nextDate = new Date(date);
			nextDate.setDate(date.getDate() + 1);

			const journalCount = await db
				.select({ count: sql<number>`count(*)` })
				.from(journalEntries)
				.where(
					and(
						eq(journalEntries.userId, user.id),
						eq(journalEntries.date, date.toISOString().split('T')[0])
					)
				);

			const meditationCountDay = await db
				.select({ count: sql<number>`count(*)` })
				.from(meditationSessions)
				.where(
					and(
						eq(meditationSessions.userId, user.id),
						gte(meditationSessions.completedAt, date.toISOString()),
						sql`${meditationSessions.completedAt} < ${nextDate.toISOString()}`
					)
				);

			const workoutCountDay = await db
				.select({ count: sql<number>`count(*)` })
				.from(workoutLogs)
				.where(
					and(
						eq(workoutLogs.userId, user.id),
						eq(workoutLogs.date, date.toISOString().split('T')[0])
					)
				);

			weeklyActivity.push({
				date: date.toISOString().split('T')[0],
				journal: Number(journalCount[0]?.count || 0),
				meditation: Number(meditationCountDay[0]?.count || 0),
				workouts: Number(workoutCountDay[0]?.count || 0)
			});
		}

		const recentJournalEntries = await db.query.journalEntries.findMany({
			where: eq(journalEntries.userId, user.id),
			orderBy: [desc(journalEntries.createdAt)],
			limit: 3
		});

		const recentWorkouts = await db.query.workoutLogs.findMany({
			where: eq(workoutLogs.userId, user.id),
			orderBy: [desc(workoutLogs.createdAt)],
			limit: 3
		});

		const recentMeditations = await db.query.meditationSessions.findMany({
			where: eq(meditationSessions.userId, user.id),
			orderBy: [desc(meditationSessions.createdAt)],
			limit: 3,
			with: {
				routine: true
			}
		});

		return {
			stats: {
				journalThisWeek: Number(journalCountThisWeek[0]?.count || 0),
				journalLastWeek: Number(journalCountLastWeek[0]?.count || 0),
				meditationThisWeek: Number(meditationCountThisWeek[0]?.count || 0),
				meditationLastWeek: Number(meditationCountLastWeek[0]?.count || 0),
				workoutsThisWeek: Number(workoutCountThisWeek[0]?.count || 0),
				workoutsLastWeek: Number(workoutCountLastWeek[0]?.count || 0),
				workoutsCompletedMonth: Number(workoutCountMonth[0]?.count || 0),
				weeklyActivity
			},
			recentJournalEntries,
			recentWorkouts,
			recentMeditations
		};
	} catch (error) {
		logger.error('Failed to delete journal entry', { error });

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
