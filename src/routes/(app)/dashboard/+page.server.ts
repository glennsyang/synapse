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
	calendarDaysBetween,
	formatDateMedium,
	formatMonthDay,
	formatTime12Hour,
	formatTimestampMedium,
	formatTimestampShort,
	formatTodayLabel,
	getISODayOfWeek,
	getStartOfWeek,
	getTodayString,
	getWeekDates
} from '$lib/utils/date';
import { logger } from '$lib/utils/logger';
import { createMarkdownExcerpt } from '$lib/utils/markdown';
import { calculatePersonVisitStatus } from '$lib/utils/visit-status';
import { getWorkoutLabel } from '$lib/utils/workout';
import { and, desc, eq, gte, lte, ne, sql } from 'drizzle-orm';

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

type DashboardDateRanges = {
	today: string;
	startOfThisWeekDate: string;
	endOfThisWeekDate: string;
	startOfLastWeekDate: string;
	startOfMonthDate: string;
	thisWeekDates: string[];
	lastWeekDates: string[];
	meditationRangeStartIso: string;
	meditationRangeEndIso: string;
	agenda8WeeksStart: string;
	last4WeeksStart: string;
	workout4WeeksStart: string;
	upcomingEndDate: string;
	tasksCompletionRangeStartIso: string;
	tasksCompletionRangeEndIso: string;
};

type ItemBucket = {
	title: string;
	titleDate: string;
	last4: { total: number; completed: number };
	prev4: { total: number; completed: number };
	dow: { total: number[]; completed: number[] };
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

// ── Date ranges ────────────────────────────────────────────────────────────────
function buildDateRanges(today: string): DashboardDateRanges {
	const startOfThisWeekDate = getStartOfWeek(today);
	const endOfThisWeekDate = addDaysToDateString(startOfThisWeekDate, 7);
	const startOfLastWeekDate = addDaysToDateString(startOfThisWeekDate, -7);
	return {
		today,
		startOfThisWeekDate,
		endOfThisWeekDate,
		startOfLastWeekDate,
		startOfMonthDate: addDaysToDateString(today, -30),
		thisWeekDates: getWeekDates(startOfThisWeekDate),
		lastWeekDates: getWeekDates(startOfLastWeekDate),
		meditationRangeStartIso: `${addDaysToDateString(startOfLastWeekDate, -1)}T00:00:00.000Z`,
		meditationRangeEndIso: `${addDaysToDateString(endOfThisWeekDate, 1)}T00:00:00.000Z`,
		agenda8WeeksStart: addDaysToDateString(startOfThisWeekDate, -49),
		last4WeeksStart: addDaysToDateString(startOfThisWeekDate, -21),
		workout4WeeksStart: addDaysToDateString(today, -28),
		upcomingEndDate: addDaysToDateString(today, 7),
		tasksCompletionRangeStartIso: `${addDaysToDateString(startOfLastWeekDate, -1)}T00:00:00.000Z`,
		tasksCompletionRangeEndIso: `${addDaysToDateString(endOfThisWeekDate, 1)}T00:00:00.000Z`
	};
}

// ── Database queries ───────────────────────────────────────────────────────────
async function runDashboardQueries(
	db: ReturnType<typeof getDb>,
	userId: string,
	r: DashboardDateRanges
) {
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
			.select({ date: journalEntries.date, count: sql<number>`count(*)` })
			.from(journalEntries)
			.where(
				and(
					eq(journalEntries.userId, userId),
					gte(journalEntries.date, r.startOfLastWeekDate),
					sql`${journalEntries.date} < ${r.endOfThisWeekDate}`
				)
			)
			.groupBy(journalEntries.date),
		db
			.select({ date: workoutLogs.date, count: sql<number>`count(*)` })
			.from(workoutLogs)
			.where(
				and(
					eq(workoutLogs.userId, userId),
					gte(workoutLogs.date, r.startOfLastWeekDate),
					sql`${workoutLogs.date} < ${r.endOfThisWeekDate}`
				)
			)
			.groupBy(workoutLogs.date),
		db
			.select({ completedAt: meditationSessions.completedAt })
			.from(meditationSessions)
			.where(
				and(
					eq(meditationSessions.userId, userId),
					gte(meditationSessions.completedAt, r.meditationRangeStartIso),
					sql`${meditationSessions.completedAt} < ${r.meditationRangeEndIso}`
				)
			),
		db
			.select({ count: sql<number>`count(*)` })
			.from(workoutLogs)
			.where(and(eq(workoutLogs.userId, userId), gte(workoutLogs.date, r.startOfMonthDate))),
		db.query.journalEntries.findMany({
			where: eq(journalEntries.userId, userId),
			orderBy: [desc(journalEntries.createdAt)],
			limit: 5
		}),
		db.query.workoutLogs.findMany({
			where: eq(workoutLogs.userId, userId),
			orderBy: [desc(workoutLogs.createdAt)],
			limit: 5
		}),
		db.query.meditationSessions.findMany({
			where: eq(meditationSessions.userId, userId),
			orderBy: [desc(meditationSessions.completedAt)],
			limit: 5,
			with: { routine: true }
		}),
		db
			.select({
				id: dailyAgendaEntries.id,
				date: dailyAgendaEntries.date,
				completed: dailyAgendaEntries.completed,
				title: dailyAgendaEntries.title,
				templateGroupId: dailyAgendaEntries.templateGroupId,
				sortOrder: dailyAgendaEntries.sortOrder
			})
			.from(dailyAgendaEntries)
			.where(
				and(
					eq(dailyAgendaEntries.userId, userId),
					gte(dailyAgendaEntries.date, r.agenda8WeeksStart),
					sql`${dailyAgendaEntries.date} < ${r.endOfThisWeekDate}`
				)
			),
		db
			.select({ completedAt: tasks.completedAt })
			.from(tasks)
			.where(
				and(
					eq(tasks.userId, userId),
					eq(tasks.state, 'done'),
					gte(tasks.completedAt, r.tasksCompletionRangeStartIso),
					sql`${tasks.completedAt} < ${r.tasksCompletionRangeEndIso}`
				)
			),
		db
			.select({ count: sql<number>`count(*)` })
			.from(tasks)
			.where(and(eq(tasks.userId, userId), ne(tasks.state, 'done'), lte(tasks.priority, 2))),
		db
			.select({ count: sql<number>`count(*)` })
			.from(tasks)
			.where(and(eq(tasks.userId, userId), ne(tasks.state, 'done'))),
		db
			.select({ type: workoutLogs.type, count: sql<number>`count(*)` })
			.from(workoutLogs)
			.where(and(eq(workoutLogs.userId, userId), gte(workoutLogs.date, r.workout4WeeksStart)))
			.groupBy(workoutLogs.type),
		db
			.select({ id: people.id, name: people.name, isExempt: people.isExempt })
			.from(people)
			.where(and(eq(people.userId, userId), eq(people.isArchived, false))),
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
				.where(eq(visits.userId, userId))
				.as('latest_visits_subq');
			return db
				.select({ personId: subq.personId, date: subq.date, followUpDate: subq.followUpDate })
				.from(subq)
				.where(sql`${subq.rn} = 1`);
		})(),
		db.query.tasks.findMany({
			where: and(eq(tasks.userId, userId), eq(tasks.state, 'done')),
			orderBy: [desc(tasks.completedAt)],
			limit: 5
		}),
		db.query.visits.findMany({
			where: eq(visits.userId, userId),
			orderBy: [desc(visits.createdAt)],
			limit: 5,
			with: { person: { columns: { name: true } } }
		}),
		db
			.select({ personId: visits.personId, personName: people.name, date: visits.date })
			.from(visits)
			.innerJoin(people, and(eq(visits.personId, people.id), eq(people.isArchived, false)))
			.where(
				and(
					eq(visits.userId, userId),
					gte(visits.date, r.today),
					lte(visits.date, r.upcomingEndDate)
				)
			)
			.orderBy(visits.date),
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
					eq(visits.userId, userId),
					gte(visits.followUpDate, r.today),
					lte(visits.followUpDate, r.upcomingEndDate)
				)
			)
			.orderBy(visits.followUpDate)
	]);

	return {
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
	};
}

type QueryData = Awaited<ReturnType<typeof runDashboardQueries>>;

// ── Post-processing helpers ────────────────────────────────────────────────────
function buildCountByDateMap(rows: { date: string; count: number }[]): Map<string, number> {
	return new Map(rows.map((r) => [r.date, Number(r.count || 0)]));
}

function sumCountsByDate(countByDate: Map<string, number>, dates: string[]): number {
	return dates.reduce((total, date) => total + (countByDate.get(date) ?? 0), 0);
}

function buildMeditationCountByDate(
	sessions: { completedAt: string }[],
	startOfLastWeekDate: string,
	endOfThisWeekDate: string
): Map<string, number> {
	const map = new Map<string, number>();
	for (const session of sessions) {
		const localDate = getTodayString(new Date(session.completedAt));
		if (localDate < startOfLastWeekDate || localDate >= endOfThisWeekDate) continue;
		map.set(localDate, (map.get(localDate) ?? 0) + 1);
	}
	return map;
}

function buildAgendaCompletionTrend(
	entries: { date: string; completed: boolean }[],
	startOfThisWeekDate: string
): { weekLabel: string; completionPct: number }[] {
	return Array.from({ length: 8 }, (_, i) => {
		const weekStart = addDaysToDateString(startOfThisWeekDate, -(7 - i) * 7);
		const weekEnd = addDaysToDateString(weekStart, 7);
		const entriesInWeek = entries.filter((e) => e.date >= weekStart && e.date < weekEnd);
		const total = entriesInWeek.length;
		const completed = entriesInWeek.filter((e) => e.completed).length;
		return {
			weekLabel: formatMonthDay(weekStart),
			completionPct: total > 0 ? Math.round((completed / total) * 100) : 0
		};
	});
}

function buildTaskStats(
	completionRaw: { completedAt: string | null }[],
	openHighPriorityResult: { count: number }[],
	openTotalResult: { count: number }[],
	thisWeekDates: string[],
	lastWeekDates: string[]
) {
	const thisWeekDateSet = new Set(thisWeekDates);
	const lastWeekDateSet = new Set(lastWeekDates);
	let completedThisWeek = 0;
	let completedLastWeek = 0;
	for (const row of completionRaw) {
		if (row.completedAt === null) continue;
		const localDate = getTodayString(new Date(row.completedAt));
		if (thisWeekDateSet.has(localDate)) completedThisWeek++;
		else if (lastWeekDateSet.has(localDate)) completedLastWeek++;
	}
	return {
		completedThisWeek,
		completedLastWeek,
		openHighPriority: Number(openHighPriorityResult[0]?.count || 0),
		openTotal: Number(openTotalResult[0]?.count || 0)
	};
}

function buildActivityFeed(
	data: Pick<
		QueryData,
		| 'recentJournalRaw'
		| 'recentWorkoutRaw'
		| 'recentMeditationRaw'
		| 'recentTaskRaw'
		| 'recentVisitRaw'
	>
): ActivityItem[] {
	return [
		...data.recentJournalRaw.map((e) => ({
			type: 'journal' as const,
			id: e.id,
			href: `/journal/${e.id}`,
			title: createMarkdownExcerpt(e.content, 80),
			meta: formatTimestampShort(e.createdAt),
			timestamp: e.createdAt
		})),
		...data.recentWorkoutRaw.map((w) => ({
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
		...data.recentMeditationRaw.map((s) => ({
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
		...data.recentTaskRaw
			.filter((t): t is typeof t & { completedAt: string } => t.completedAt !== null)
			.map((t) => ({
				type: 'task' as const,
				id: t.id,
				href: '/tasks',
				title: t.title,
				meta: formatTimestampShort(t.completedAt),
				timestamp: t.completedAt
			})),
		...data.recentVisitRaw.map((v) => ({
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
}

function buildAgendaItemStats(
	entries: QueryData['agendaEntriesForTrend'],
	ranges: DashboardDateRanges
): {
	title: string;
	completionPct: number;
	prevCompletionPct: number;
	dowCompletionPct: number[];
	totalDays: number;
}[] {
	const { agenda8WeeksStart, endOfThisWeekDate, last4WeeksStart } = ranges;
	const itemBuckets = new Map<string, ItemBucket>();

	for (const entry of entries) {
		const isLast4 = entry.date >= last4WeeksStart && entry.date < endOfThisWeekDate;
		const isPrev4 = entry.date >= agenda8WeeksStart && entry.date < last4WeeksStart;
		if (!isLast4 && !isPrev4) continue;

		const groupKey = entry.templateGroupId ?? entry.title;
		const dowIndex = getISODayOfWeek(entry.date);
		let bucket = itemBuckets.get(groupKey);
		if (!bucket) {
			bucket = {
				title: entry.title,
				titleDate: entry.date,
				last4: { total: 0, completed: 0 },
				prev4: { total: 0, completed: 0 },
				dow: {
					total: Array.from<number>({ length: 7 }),
					completed: Array.from<number>({ length: 7 })
				}
			};
			itemBuckets.set(groupKey, bucket);
		}
		if (entry.date > bucket.titleDate) {
			bucket.title = entry.title;
			bucket.titleDate = entry.date;
		}
		const period = isLast4 ? bucket.last4 : bucket.prev4;
		period.total++;
		if (entry.completed) period.completed++;
		bucket.dow.total[dowIndex]++;
		if (entry.completed) bucket.dow.completed[dowIndex]++;
	}

	return Array.from(itemBuckets.values())
		.filter((b) => b.last4.total + b.prev4.total >= 7)
		.map((b) => ({
			title: b.title,
			completionPct: b.last4.total > 0 ? Math.round((b.last4.completed / b.last4.total) * 100) : 0,
			prevCompletionPct:
				b.prev4.total > 0 ? Math.round((b.prev4.completed / b.prev4.total) * 100) : 0,
			dowCompletionPct: b.dow.total.map((tot, i) =>
				tot > 0 ? Math.round((b.dow.completed[i] / tot) * 100) : -1
			),
			totalDays: b.last4.total + b.prev4.total
		}))
		.sort((a, b) => a.completionPct - b.completionPct);
}

function buildTodayAgendaSummary(entries: QueryData['agendaEntriesForTrend'], today: string) {
	const todayEntries = entries
		.filter((e) => e.date === today)
		.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
	return {
		completed: todayEntries.filter((e) => e.completed).length,
		total: todayEntries.length,
		items: todayEntries.map((e) => ({ id: e.id, title: e.title, completed: e.completed }))
	};
}

function buildDaysSinceLastWorkout(workouts: { date: string }[], today: string): number | null {
	const lastWorkoutDate = workouts.reduce<string | null>(
		(latest, w) => (!latest || w.date > latest ? w.date : latest),
		null
	);
	return lastWorkoutDate ? calendarDaysBetween(lastWorkoutDate, today) : null;
}

function emptyDashboardReturn() {
	return {
		todayLabel: formatTodayLabel(),
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
		recentActivity: [] as ActivityItem[],
		agendaItemStats: [] as {
			title: string;
			completionPct: number;
			prevCompletionPct: number;
			dowCompletionPct: number[];
			totalDays: number;
		}[],
		daysSinceLastWorkout: null as number | null,
		todayAgendaSummary: {
			completed: 0,
			total: 0,
			items: [] as { id: string; title: string; completed: boolean }[]
		}
	};
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) return emptyDashboardReturn();

	const today = getTodayString();
	const ranges = buildDateRanges(today);
	const db = getDb();

	try {
		const data = await runDashboardQueries(db, user.id, ranges);

		const journalCountByDate = buildCountByDateMap(data.journalDateCounts);
		const workoutCountByDate = buildCountByDateMap(data.workoutDateCounts);
		const meditationCountByDate = buildMeditationCountByDate(
			data.meditationSessionsInRange,
			ranges.startOfLastWeekDate,
			ranges.endOfThisWeekDate
		);
		const latestVisitByPersonId = new Map(
			data.allVisitsRaw.map((v) => [v.personId, { date: v.date, followUpDate: v.followUpDate }])
		);
		const { counts: visitHealthCounts, names: visitHealthNames } = buildVisitHealth(
			data.allPeopleRaw,
			latestVisitByPersonId,
			today
		);

		return {
			todayLabel: formatTodayLabel(),
			stats: {
				journalThisWeek: sumCountsByDate(journalCountByDate, ranges.thisWeekDates),
				journalLastWeek: sumCountsByDate(journalCountByDate, ranges.lastWeekDates),
				meditationThisWeek: sumCountsByDate(meditationCountByDate, ranges.thisWeekDates),
				meditationLastWeek: sumCountsByDate(meditationCountByDate, ranges.lastWeekDates),
				workoutsThisWeek: sumCountsByDate(workoutCountByDate, ranges.thisWeekDates),
				workoutsLastWeek: sumCountsByDate(workoutCountByDate, ranges.lastWeekDates),
				workoutsCompletedMonth: Number(data.workoutCountMonth[0]?.count || 0)
			},
			taskStats: buildTaskStats(
				data.tasksCompletionRaw,
				data.openHighPriorityResult,
				data.openTotalResult,
				ranges.thisWeekDates,
				ranges.lastWeekDates
			),
			agendaCompletionTrend: buildAgendaCompletionTrend(
				data.agendaEntriesForTrend,
				ranges.startOfThisWeekDate
			),
			workoutTypeBreakdown: data.workoutTypeBreakdownRaw
				.map((r) => ({ type: r.type, count: Number(r.count || 0) }))
				.sort((a, b) => b.count - a.count),
			visitHealthCounts,
			visitHealthNames,
			upcomingVisits: buildUpcomingVisits(
				data.upcomingVisitsByDateRaw,
				data.upcomingFollowUpsByDateRaw,
				today
			),
			recentActivity: buildActivityFeed(data),
			agendaItemStats: buildAgendaItemStats(data.agendaEntriesForTrend, ranges),
			daysSinceLastWorkout: buildDaysSinceLastWorkout(data.recentWorkoutRaw, today),
			todayAgendaSummary: buildTodayAgendaSummary(data.agendaEntriesForTrend, today)
		};
	} catch (error) {
		logger.error('Failed to load dashboard data', { error });
		return emptyDashboardReturn();
	}
};
