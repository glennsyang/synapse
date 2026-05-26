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
import { and, desc, eq, gte, lte, ne, sql } from 'drizzle-orm';

const appTodayLabelFormatter = new Intl.DateTimeFormat('en-US', {
	timeZone: 'America/Los_Angeles',
	weekday: 'long',
	month: 'long',
	day: 'numeric'
});

import { logger } from '$lib/utils/logger';
import { createMarkdownExcerpt } from '$lib/utils/markdown';
import { calculatePersonVisitStatus } from '$lib/utils/visit-status';
import { getWorkoutLabel } from '$lib/utils/workout';

import type { PageServerLoad } from './$types';

type ActivityItem = {
	type: 'journal' | 'workout' | 'meditation' | 'task' | 'visit';
	id: string;
	href: string;
	title: string;
	meta: string;
	timestamp: string;
};

type VisitHealthBucket = 'critical' | 'overdue' | 'healthy' | 'noVisits';

type VisitHealthResult = {
	counts: Record<VisitHealthBucket, number> & { total: number };
	names: Record<VisitHealthBucket, string[]>;
};

const STATUS_KEY_MAP: Record<string, VisitHealthBucket> = {
	red: 'critical',
	yellow: 'overdue',
	green: 'healthy',
	scheduled: 'healthy',
	none: 'noVisits'
};

function getDayLabel(date: string, today: string, tomorrow: string): string {
	if (date === today) return 'Today';
	if (date === tomorrow) return 'Tomorrow';
	return formatDateMedium(date);
}

type UpcomingVisitRow = { personId: string; personName: string; date: string };
type UpcomingFollowUpRow = { personId: string; personName: string; followUpDate: string | null };

function buildUpcomingVisits(
	byDateRaw: UpcomingVisitRow[],
	byFollowUpRaw: UpcomingFollowUpRow[],
	today: string
): { dayLabel: string; names: string[]; isToday: boolean }[] {
	const tomorrow = addDaysToDateString(today, 1);
	// Outer key: date string. Inner key: personId → personName (O(1) dedup).
	const map = new Map<string, Map<string, string>>();

	for (const v of byDateRaw) {
		const inner = map.get(v.date) ?? new Map<string, string>();
		inner.set(v.personId, v.personName);
		map.set(v.date, inner);
	}

	for (const v of byFollowUpRaw) {
		if (!v.followUpDate) continue;
		const inner = map.get(v.followUpDate) ?? new Map<string, string>();
		inner.set(v.personId, v.personName);
		map.set(v.followUpDate, inner);
	}

	return Array.from(map.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([date, inner]) => ({
			dayLabel: getDayLabel(date, today, tomorrow),
			names: Array.from(inner.values()).sort((a, b) => a.localeCompare(b)),
			isToday: date === today
		}));
}

function buildVisitHealth(
	peopleRaw: { id: string; name: string; isExempt: boolean }[],
	visitsMap: Map<string, { date: string; followUpDate: string | null }>,
	today: string
): VisitHealthResult {
	const counts: Record<VisitHealthBucket, number> & { total: number } = {
		critical: 0,
		overdue: 0,
		healthy: 0,
		noVisits: 0,
		total: 0
	};
	const names: Record<VisitHealthBucket, string[]> = {
		critical: [],
		overdue: [],
		healthy: [],
		noVisits: []
	};
	for (const person of peopleRaw) {
		const latestVisit = visitsMap.get(person.id);
		const { status } = calculatePersonVisitStatus(
			latestVisit?.date ?? null,
			person.isExempt,
			latestVisit?.followUpDate ?? null,
			today
		);
		const key = STATUS_KEY_MAP[status];
		if (key) {
			counts[key]++;
			counts.total++;
			names[key].push(person.name);
		}
	}
	return { counts, names };
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		return {
			todayLabel: appTodayLabelFormatter.format(new Date()),
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
			visitHealthNames: {
				critical: [] as string[],
				overdue: [] as string[],
				healthy: [] as string[],
				noVisits: [] as string[]
			},
			upcomingVisits: [] as { dayLabel: string; names: string[]; isToday: boolean }[],
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
	const agenda8WeeksStart = addDaysToDateString(startOfThisWeekDate, -49);
	const workout4WeeksStart = addDaysToDateString(today, -28);
	const upcomingEndDate = addDaysToDateString(today, 7);
	// Buffered UTC range for task completion counts — app-local filtering happens in JS
	const tasksCompletionRangeStartIso = `${addDaysToDateString(startOfLastWeekDate, -1)}T00:00:00.000Z`;
	const tasksCompletionRangeEndIso = `${addDaysToDateString(endOfThisWeekDate, 1)}T00:00:00.000Z`;

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
			tasksCompletionRaw,
			openHighPriorityResult,
			openTotalResult,
			workoutTypeBreakdownRaw,
			allPeopleRaw,
			allVisitsRaw,
			recentTaskRaw,
			recentVisitRaw,
			upcomingVisitsByDateRaw,
			upcomingFollowUpsByDateRaw
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
						gte(dailyAgendaEntries.date, agenda8WeeksStart),
						sql`${dailyAgendaEntries.date} < ${endOfThisWeekDate}`
					)
				),
			// Task completions this/last week — buffered UTC range, counted in app timezone
			db
				.select({ completedAt: tasks.completedAt })
				.from(tasks)
				.where(
					and(
						eq(tasks.userId, user.id),
						eq(tasks.state, 'done'),
						gte(tasks.completedAt, tasksCompletionRangeStartIso),
						sql`${tasks.completedAt} < ${tasksCompletionRangeEndIso}`
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
				.select({ id: people.id, name: people.name, isExempt: people.isExempt })
				.from(people)
				.where(and(eq(people.userId, user.id), eq(people.isArchived, false))),
			// Latest visit per non-archived person — window function keeps only rn=1
			(() => {
				const subq = db
					.select({
						personId: visits.personId,
						date: visits.date,
						followUpDate: visits.followUpDate,
						rn: sql<number>`row_number() over (partition by ${visits.personId} order by ${visits.date} desc, ${visits.createdAt} desc)`.as(
							'rn'
						)
					})
					.from(visits)
					.innerJoin(people, and(eq(visits.personId, people.id), eq(people.isArchived, false)))
					.where(eq(visits.userId, user.id))
					.as('latest_visits_subq');
				return db
					.select({
						personId: subq.personId,
						date: subq.date,
						followUpDate: subq.followUpDate
					})
					.from(subq)
					.where(sql`${subq.rn} = 1`);
			})(),
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
			}),
			// Visits with a date falling today–today+7
			db
				.select({ personId: visits.personId, personName: people.name, date: visits.date })
				.from(visits)
				.innerJoin(people, and(eq(visits.personId, people.id), eq(people.isArchived, false)))
				.where(
					and(
						eq(visits.userId, user.id),
						gte(visits.date, today),
						lte(visits.date, upcomingEndDate)
					)
				)
				.orderBy(visits.date),
			// Visits whose follow-up date falls today–today+7
			db
				.select({
					personId: visits.personId,
					personName: people.name,
					followUpDate: visits.followUpDate
				})
				.from(visits)
				.innerJoin(people, and(eq(visits.personId, people.id), eq(people.isArchived, false)))
				.where(
					and(
						eq(visits.userId, user.id),
						gte(visits.followUpDate, today),
						lte(visits.followUpDate, upcomingEndDate)
					)
				)
				.orderBy(visits.followUpDate)
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

		// 1. Agenda completion trend (8 weeks, oldest first)
		const agendaCompletionTrend = Array.from({ length: 8 }, (_, i) => {
			const weekStart = addDaysToDateString(startOfThisWeekDate, -(7 - i) * 7);
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

		// 2. Task stats — count completions per app-local week
		const thisWeekDateSet = new Set(thisWeekDates);
		const lastWeekDateSet = new Set(lastWeekDates);
		let completedThisWeek = 0;
		let completedLastWeek = 0;
		for (const row of tasksCompletionRaw) {
			if (row.completedAt === null) continue;
			const localDate = getTodayString(new Date(row.completedAt));
			if (thisWeekDateSet.has(localDate)) completedThisWeek++;
			else if (lastWeekDateSet.has(localDate)) completedLastWeek++;
		}
		const taskStats = {
			completedThisWeek,
			completedLastWeek,
			openHighPriority: Number(openHighPriorityResult[0]?.count || 0),
			openTotal: Number(openTotalResult[0]?.count || 0)
		};

		// 3. Workout type breakdown (sorted descending by count)
		const workoutTypeBreakdown = workoutTypeBreakdownRaw
			.map((row) => ({ type: row.type, count: Number(row.count || 0) }))
			.sort((a, b) => b.count - a.count);

		// 4. Visit health counts — allVisitsRaw already has at most one row per active person
		const latestVisitByPersonId = new Map(
			allVisitsRaw.map((v) => [v.personId, { date: v.date, followUpDate: v.followUpDate }])
		);
		const { counts: visitHealthCounts, names: visitHealthNames } = buildVisitHealth(
			allPeopleRaw,
			latestVisitByPersonId,
			today
		);

		// 5. Upcoming visits — today and next 7 days (by visit date or follow-up date)
		const upcomingVisits = buildUpcomingVisits(
			upcomingVisitsByDateRaw,
			upcomingFollowUpsByDateRaw,
			today
		);

		// 6. Recent activity feed — merge all types, sort desc by timestamp, take top 10
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
				title: `${getWorkoutLabel(w.type)} Workout`,
				meta: [
					formatDateMedium(w.date),
					w.time ? `@ ${formatTime12Hour(w.time)}` : '',
					w.durationMinutes ? `· ${w.durationMinutes} min` : ''
				]
					.filter(Boolean)
					.join(' '),
				timestamp: w.createdAt
			})),
			...recentMeditationRaw.map((s) => ({
				type: 'meditation' as const,
				id: s.id,
				href: '/meditation',
				title: s.routine?.title ?? 'Meditation',
				meta: [
					formatTimestampMedium(s.completedAt),
					s.routine?.durationMinutes ? `· ${s.routine.durationMinutes} min` : ''
				]
					.filter(Boolean)
					.join(' '),
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
			todayLabel: appTodayLabelFormatter.format(new Date()),
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
			visitHealthNames,
			upcomingVisits,
			recentActivity
		};
	} catch (error) {
		logger.error('Failed to load dashboard data', { error });

		return {
			todayLabel: appTodayLabelFormatter.format(new Date()),
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
			visitHealthNames: {
				critical: [] as string[],
				overdue: [] as string[],
				healthy: [] as string[],
				noVisits: [] as string[]
			},
			upcomingVisits: [] as { dayLabel: string; names: string[]; isToday: boolean }[],
			recentActivity: [] as ActivityItem[]
		};
	}
};
