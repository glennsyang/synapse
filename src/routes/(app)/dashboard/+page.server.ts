import { and, asc, desc, eq, gte, lte, ne, sql } from 'drizzle-orm';

import { getDb } from '$lib/server/db';
import {
	dailyAgendaEntries,
	journalEntries,
	meditationSessions,
	people,
	tasks,
	visits,
	workoutLogs
} from '$lib/server/db/schema';
import {
	addDaysToDateString,
	formatDateMedium,
	formatTime12Hour,
	formatTimestampMedium,
	formatTimestampShort,
	getStartOfWeek,
	getTodayString,
	getWeekDates,
	parseLocalDateString
} from '$lib/utils/date';
import { logger } from '$lib/utils/logger';
import { createMarkdownExcerpt } from '$lib/utils/markdown';
import { calculatePersonVisitStatus } from '$lib/utils/visit-status';

import type { PageServerLoad } from './$types';

type ActivityItem = {
	type: 'journal' | 'workout' | 'meditation' | 'task' | 'visit';
	id: string;
	href: string;
	title: string;
	meta: string;
	timestamp: string;
};

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
				workoutsCompletedMonth: 0
			},
			taskStats: { completedThisWeek: 0, completedLastWeek: 0, openHighPriority: 0, openTotal: 0 },
			agendaCompletionTrend: [] as { weekLabel: string; completionPct: number }[],
			workoutTypeBreakdown: [] as { type: string; count: number }[],
			visitHealthCounts: { critical: 0, overdue: 0, healthy: 0, noVisits: 0, total: 0 },
			recentActivity: [] as ActivityItem[]
		};
	}

	const today = getTodayString();
	const startOfThisWeekDate = getStartOfWeek(today);
	const endOfThisWeekDate = addDaysToDateString(startOfThisWeekDate, 7);
	const startOfLastWeekDate = addDaysToDateString(startOfThisWeekDate, -7);
	const startOfMonthDate = addDaysToDateString(today, -30);
	const thisWeekDates = getWeekDates(startOfThisWeekDate);
	const lastWeekDates = getWeekDates(startOfLastWeekDate);
	const meditationRangeStartIso = `${addDaysToDateString(startOfLastWeekDate, -1)}T00:00:00.000Z`;
	const meditationRangeEndIso = `${addDaysToDateString(endOfThisWeekDate, 1)}T00:00:00.000Z`;

	// Dates for new analytics
	const agenda6WeeksStart = addDaysToDateString(startOfThisWeekDate, -35);
	const workout4WeeksStart = addDaysToDateString(today, -28);
	const thisWeekStartIso = `${startOfThisWeekDate}T00:00:00.000Z`;
	const endOfThisWeekIso = `${endOfThisWeekDate}T00:00:00.000Z`;
	const lastWeekStartIso = `${startOfLastWeekDate}T00:00:00.000Z`;

	const db = getDb();

	try {
		const [
			journalDateCounts,
			workoutDateCounts,
			meditationSessionsInRange,
			workoutCountMonth,
			recentJournalRaw,
			recentWorkoutRaw,
			recentMeditationRaw,
			agendaEntriesForTrend,
			tasksCompletedThisWeekResult,
			tasksCompletedLastWeekResult,
			openHighPriorityResult,
			openTotalResult,
			workoutTypeBreakdownRaw,
			allPeopleRaw,
			allVisitsRaw,
			recentTaskRaw,
			recentVisitRaw
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
				limit: 5
			}),
			db.query.workoutLogs.findMany({
				where: eq(workoutLogs.userId, user.id),
				orderBy: [desc(workoutLogs.createdAt)],
				limit: 5
			}),
			db.query.meditationSessions.findMany({
				where: eq(meditationSessions.userId, user.id),
				orderBy: [desc(meditationSessions.completedAt)],
				limit: 5,
				with: {
					routine: true
				}
			}),
			// Agenda entries for 6-week completion trend
			db
				.select({ date: dailyAgendaEntries.date, completed: dailyAgendaEntries.completed })
				.from(dailyAgendaEntries)
				.where(
					and(
						eq(dailyAgendaEntries.userId, user.id),
						gte(dailyAgendaEntries.date, agenda6WeeksStart),
						sql`${dailyAgendaEntries.date} < ${endOfThisWeekDate}`
					)
				),
			// Tasks completed this week
			db
				.select({ count: sql<number>`count(*)` })
				.from(tasks)
				.where(
					and(
						eq(tasks.userId, user.id),
						eq(tasks.state, 'done'),
						gte(tasks.completedAt, thisWeekStartIso),
						sql`${tasks.completedAt} < ${endOfThisWeekIso}`
					)
				),
			// Tasks completed last week
			db
				.select({ count: sql<number>`count(*)` })
				.from(tasks)
				.where(
					and(
						eq(tasks.userId, user.id),
						eq(tasks.state, 'done'),
						gte(tasks.completedAt, lastWeekStartIso),
						sql`${tasks.completedAt} < ${thisWeekStartIso}`
					)
				),
			// Open high priority tasks (priority 1 or 2)
			db
				.select({ count: sql<number>`count(*)` })
				.from(tasks)
				.where(and(eq(tasks.userId, user.id), ne(tasks.state, 'done'), lte(tasks.priority, 2))),
			// Open total tasks
			db
				.select({ count: sql<number>`count(*)` })
				.from(tasks)
				.where(and(eq(tasks.userId, user.id), ne(tasks.state, 'done'))),
			// Workout type breakdown (last 4 weeks)
			db
				.select({ type: workoutLogs.type, count: sql<number>`count(*)` })
				.from(workoutLogs)
				.where(and(eq(workoutLogs.userId, user.id), gte(workoutLogs.date, workout4WeeksStart)))
				.groupBy(workoutLogs.type),
			// All non-archived people for visit health counts
			db
				.select({ id: people.id, isExempt: people.isExempt })
				.from(people)
				.where(and(eq(people.userId, user.id), eq(people.isArchived, false))),
			// All visits for this user (ordered to allow latest-per-person extraction)
			db
				.select({
					personId: visits.personId,
					date: visits.date,
					followUpDate: visits.followUpDate
				})
				.from(visits)
				.where(eq(visits.userId, user.id))
				.orderBy(asc(visits.personId), desc(visits.date), desc(visits.createdAt)),
			// Recent completed tasks for activity feed
			db.query.tasks.findMany({
				where: and(eq(tasks.userId, user.id), eq(tasks.state, 'done')),
				orderBy: [desc(tasks.completedAt)],
				limit: 5
			}),
			// Recent visits with person name for activity feed
			db.query.visits.findMany({
				where: eq(visits.userId, user.id),
				orderBy: [desc(visits.createdAt)],
				limit: 5,
				with: {
					person: { columns: { name: true } }
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

		// --- new analytics post-processing ---

		// 1. Agenda completion trend (6 weeks, oldest first)
		const agendaCompletionTrend = Array.from({ length: 6 }, (_, i) => {
			const weekStart = addDaysToDateString(startOfThisWeekDate, -(5 - i) * 7);
			const weekEnd = addDaysToDateString(weekStart, 7);
			const entriesInWeek = agendaEntriesForTrend.filter(
				(e) => e.date >= weekStart && e.date < weekEnd
			);
			const total = entriesInWeek.length;
			const completed = entriesInWeek.filter((e) => e.completed).length;
			const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
			const weekLabelDate = parseLocalDateString(weekStart);
			const weekLabel = weekLabelDate.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric'
			});
			return { weekLabel, completionPct };
		});

		// 2. Task stats
		const taskStats = {
			completedThisWeek: Number(tasksCompletedThisWeekResult[0]?.count || 0),
			completedLastWeek: Number(tasksCompletedLastWeekResult[0]?.count || 0),
			openHighPriority: Number(openHighPriorityResult[0]?.count || 0),
			openTotal: Number(openTotalResult[0]?.count || 0)
		};

		// 3. Workout type breakdown (sorted descending by count)
		const workoutTypeBreakdown = workoutTypeBreakdownRaw
			.map((row) => ({ type: row.type, count: Number(row.count || 0) }))
			.sort((a, b) => b.count - a.count);

		// 4. Visit health counts
		const latestVisitByPersonId = new Map<string, { date: string; followUpDate: string | null }>();
		for (const visit of allVisitsRaw) {
			if (!latestVisitByPersonId.has(visit.personId)) {
				latestVisitByPersonId.set(visit.personId, {
					date: visit.date,
					followUpDate: visit.followUpDate
				});
			}
		}

		const visitHealthCounts = {
			critical: 0,
			overdue: 0,
			healthy: 0,
			noVisits: 0,
			total: allPeopleRaw.length
		};
		const statusKeyMap: Record<string, keyof Omit<typeof visitHealthCounts, 'total'>> = {
			red: 'critical',
			yellow: 'overdue',
			green: 'healthy',
			none: 'noVisits'
		};
		for (const person of allPeopleRaw) {
			const latestVisit = latestVisitByPersonId.get(person.id);
			const { status } = calculatePersonVisitStatus(
				latestVisit?.date ?? null,
				person.isExempt,
				latestVisit?.followUpDate ?? null,
				today
			);
			const key = statusKeyMap[status];
			if (key) visitHealthCounts[key]++;
		}

		// 5. Recent activity feed — merge all types, sort desc by timestamp, take top 10
		const capitalizeFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
		const recentActivity: ActivityItem[] = [
			...recentJournalRaw.map((e) => ({
				type: 'journal' as const,
				id: e.id,
				href: `/journal/${e.id}`,
				title: createMarkdownExcerpt(e.content, 80),
				meta: formatTimestampShort(e.createdAt),
				timestamp: e.createdAt
			})),
			...recentWorkoutRaw.map((w) => ({
				type: 'workout' as const,
				id: w.id,
				href: '/fitness',
				title: `${capitalizeFirst(w.type)} Workout`,
				meta: `${formatDateMedium(w.date)}${w.time ? ` @ ${formatTime12Hour(w.time)}` : ''}${w.durationMinutes ? ` · ${w.durationMinutes} min` : ''}`,
				timestamp: w.createdAt
			})),
			...recentMeditationRaw.map((s) => ({
				type: 'meditation' as const,
				id: s.id,
				href: '/meditation',
				title: s.routine?.title ?? 'Meditation',
				meta: `${formatTimestampMedium(s.completedAt)}${s.routine?.durationMinutes ? ` · ${s.routine.durationMinutes} min` : ''}`,
				timestamp: s.completedAt
			})),
			...recentTaskRaw
				.filter((t): t is typeof t & { completedAt: string } => t.completedAt !== null)
				.map((t) => ({
					type: 'task' as const,
					id: t.id,
					href: '/tasks',
					title: t.title,
					meta: formatTimestampShort(t.completedAt),
					timestamp: t.completedAt
				})),
			...recentVisitRaw.map((v) => ({
				type: 'visit' as const,
				id: v.id,
				href: '/visits',
				title: `Visit with ${v.person.name}`,
				meta: formatDateMedium(v.date),
				timestamp: v.createdAt
			}))
		]
			.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
			.slice(0, 10);

		return {
			stats: {
				journalThisWeek: sumCountsByDate(journalCountByDate, thisWeekDates),
				journalLastWeek: sumCountsByDate(journalCountByDate, lastWeekDates),
				meditationThisWeek: sumCountsByDate(meditationCountByDate, thisWeekDates),
				meditationLastWeek: sumCountsByDate(meditationCountByDate, lastWeekDates),
				workoutsThisWeek: sumCountsByDate(workoutCountByDate, thisWeekDates),
				workoutsLastWeek: sumCountsByDate(workoutCountByDate, lastWeekDates),
				workoutsCompletedMonth: Number(workoutCountMonth[0]?.count || 0)
			},
			taskStats,
			agendaCompletionTrend,
			workoutTypeBreakdown,
			visitHealthCounts,
			recentActivity
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
				workoutsCompletedMonth: 0
			},
			taskStats: { completedThisWeek: 0, completedLastWeek: 0, openHighPriority: 0, openTotal: 0 },
			agendaCompletionTrend: [] as { weekLabel: string; completionPct: number }[],
			workoutTypeBreakdown: [] as { type: string; count: number }[],
			visitHealthCounts: { critical: 0, overdue: 0, healthy: 0, noVisits: 0, total: 0 },
			recentActivity: [] as ActivityItem[]
		};
	}
};
