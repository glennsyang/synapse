import { and, desc, eq, gte, sql } from 'drizzle-orm';

import { getDb } from '$lib/server/db';
import { journalEntries, meditationSessions, todoItems } from '$lib/server/db/schema';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		return {
			stats: {
				journalStreak: 0,
				todoCompletionRate: 0,
				meditationSessions: 0,
				weeklyActivity: []
			},
			recentJournalEntries: [],
			recentTodos: [],
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

		const allTodos = await db
			.select({ count: sql<number>`count(*)` })
			.from(todoItems)
			.where(
				and(eq(todoItems.userId, user.id), gte(todoItems.createdAt, startOfMonth.toISOString()))
			);

		const completedTodos = await db
			.select({ count: sql<number>`count(*)` })
			.from(todoItems)
			.where(
				and(
					eq(todoItems.userId, user.id),
					eq(todoItems.state, 'done'),
					gte(todoItems.createdAt, startOfMonth.toISOString())
				)
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

			const todoCount = await db
				.select({ count: sql<number>`count(*)` })
				.from(todoItems)
				.where(
					and(
						eq(todoItems.userId, user.id),
						eq(todoItems.state, 'done'),
						gte(todoItems.updatedAt, date.toISOString()),
						sql`${todoItems.updatedAt} < ${nextDate.toISOString()}`
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

			weeklyActivity.push({
				date: date.toISOString().split('T')[0],
				journal: Number(journalCount[0]?.count || 0),
				todos: Number(todoCount[0]?.count || 0),
				meditation: Number(meditationCountDay[0]?.count || 0)
			});
		}

		const recentJournalEntries = await db.query.journalEntries.findMany({
			where: eq(journalEntries.userId, user.id),
			orderBy: [desc(journalEntries.createdAt)],
			limit: 3
		});

		const recentTodos = await db.query.todoItems.findMany({
			where: eq(todoItems.userId, user.id),
			orderBy: [desc(todoItems.createdAt)],
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

		const totalTodos = Number(allTodos[0]?.count || 0);
		const completedTodosCount = Number(completedTodos[0]?.count || 0);
		const completionRate =
			totalTodos > 0 ? Math.round((completedTodosCount / totalTodos) * 100) : 0;

		return {
			stats: {
				journalStreak: Number(recentJournalCount[0]?.count || 0),
				todoCompletionRate: completionRate,
				meditationSessions: Number(meditationCount[0]?.count || 0),
				weeklyActivity
			},
			recentJournalEntries,
			recentTodos,
			recentMeditations
		};
	} catch (error) {
		console.error('Dashboard data fetch error:', error);
		return {
			stats: {
				journalStreak: 0,
				todoCompletionRate: 0,
				meditationSessions: 0,
				weeklyActivity: []
			},
			recentJournalEntries: [],
			recentTodos: [],
			recentMeditations: []
		};
	}
};
