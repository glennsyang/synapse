import { and, desc, eq, gte, sql } from 'drizzle-orm';

import { getDb } from '$lib/server/db';
import { journalEntries, meditationSessions, workoutLogs } from '$lib/server/db/schema';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		return {
			stats: {
				journalStreak: 0,
				meditationSessions: 0,
				workoutsCompletedWeek: 0,
				workoutsCompletedMonth: 0,
				weeklyActivity: []
			},
			recentJournalEntries: [],
			recentWorkouts: [],
			recentMeditations: []
		};
	}

	const today = new Date();
	const startOfWeek = new Date(today);
	startOfWeek.setDate(today.getDate() - 7);
	const startOfMonth = new Date(today);
	startOfMonth.setDate(today.getDate() - 30);

	const db = getDb();

	try {
		const recentJournalCount = await db
			.select({ count: sql<number>`count(*)` })
			.from(journalEntries)
			.where(
				and(
					eq(journalEntries.userId, user.id),
					gte(journalEntries.createdAt, startOfWeek.toISOString())
				)
			);

		const workoutCountWeek = await db
			.select({ count: sql<number>`count(*)` })
			.from(workoutLogs)
			.where(
				and(eq(workoutLogs.userId, user.id), gte(workoutLogs.createdAt, startOfWeek.toISOString()))
			);

		const workoutCountMonth = await db
			.select({ count: sql<number>`count(*)` })
			.from(workoutLogs)
			.where(
				and(eq(workoutLogs.userId, user.id), gte(workoutLogs.createdAt, startOfMonth.toISOString()))
			);

		const meditationCount = await db
			.select({ count: sql<number>`count(*)` })
			.from(meditationSessions)
			.where(
				and(
					eq(meditationSessions.userId, user.id),
					gte(meditationSessions.createdAt, startOfWeek.toISOString())
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
						gte(journalEntries.createdAt, date.toISOString()),
						sql`${journalEntries.createdAt} < ${nextDate.toISOString()}`
					)
				);

			const meditationCountDay = await db
				.select({ count: sql<number>`count(*)` })
				.from(meditationSessions)
				.where(
					and(
						eq(meditationSessions.userId, user.id),
						gte(meditationSessions.createdAt, date.toISOString()),
						sql`${meditationSessions.createdAt} < ${nextDate.toISOString()}`
					)
				);

			const workoutCountDay = await db
				.select({ count: sql<number>`count(*)` })
				.from(workoutLogs)
				.where(
					and(
						eq(workoutLogs.userId, user.id),
						gte(workoutLogs.createdAt, date.toISOString()),
						sql`${workoutLogs.createdAt} < ${nextDate.toISOString()}`
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
				journalStreak: Number(recentJournalCount[0]?.count || 0),
				meditationSessions: Number(meditationCount[0]?.count || 0),
				workoutsCompletedWeek: Number(workoutCountWeek[0]?.count || 0),
				workoutsCompletedMonth: Number(workoutCountMonth[0]?.count || 0),
				weeklyActivity
			},
			recentJournalEntries,
			recentWorkouts,
			recentMeditations
		};
	} catch (error) {
		console.error('Dashboard data fetch error:', error);
		return {
			stats: {
				journalStreak: 0,
				meditationSessions: 0,
				workoutsCompletedWeek: 0,
				workoutsCompletedMonth: 0,
				weeklyActivity: []
			},
			recentJournalEntries: [],
			recentWorkouts: [],
			recentMeditations: []
		};
	}
};
