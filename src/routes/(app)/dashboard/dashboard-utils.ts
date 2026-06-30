import {
	addDaysToDateString,
	getISODayOfWeek,
	getStartOfWeek,
	getWeekDates
} from '$lib/utils/date';

export type DashboardDateRanges = {
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

export function buildDateRanges(today: string): DashboardDateRanges {
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

export type AgendaTrendEntry = {
	id: string;
	date: string;
	completed: boolean;
	title: string;
	templateGroupId: string | null;
	sortOrder: number;
};

export type AgendaItemStat = {
	title: string;
	completionPct: number;
	prevCompletionPct: number;
	dowCompletionPct: number[];
	last4Days: number;
};

type AgendaRangeWindow = 'last4' | 'prev4';

type ItemBucket = {
	title: string;
	titleDate: string;
	last4: { total: number; completed: number };
	prev4: { total: number; completed: number };
	dowLast4: { total: number[]; completed: number[] };
};

function getAgendaRangeWindow(
	date: string,
	ranges: Pick<DashboardDateRanges, 'agenda8WeeksStart' | 'last4WeeksStart' | 'endOfThisWeekDate'>
): AgendaRangeWindow | null {
	if (date >= ranges.last4WeeksStart && date < ranges.endOfThisWeekDate) {
		return 'last4';
	}
	if (date >= ranges.agenda8WeeksStart && date < ranges.last4WeeksStart) {
		return 'prev4';
	}
	return null;
}

function createItemBucket(entry: AgendaTrendEntry): ItemBucket {
	return {
		title: entry.title,
		titleDate: entry.date,
		last4: { total: 0, completed: 0 },
		prev4: { total: 0, completed: 0 },
		dowLast4: {
			total: Array.from({ length: 7 }, () => 0),
			completed: Array.from({ length: 7 }, () => 0)
		}
	};
}

function getOrCreateItemBucket(
	itemBuckets: Map<string, ItemBucket>,
	groupKey: string,
	entry: AgendaTrendEntry
): ItemBucket {
	let bucket = itemBuckets.get(groupKey);
	if (!bucket) {
		bucket = createItemBucket(entry);
		itemBuckets.set(groupKey, bucket);
	}
	return bucket;
}

function addEntryToBucket(
	bucket: ItemBucket,
	entry: AgendaTrendEntry,
	window: AgendaRangeWindow
): void {
	if (entry.date > bucket.titleDate) {
		bucket.title = entry.title;
		bucket.titleDate = entry.date;
	}

	const period = window === 'last4' ? bucket.last4 : bucket.prev4;
	period.total++;
	if (entry.completed) period.completed++;

	if (window === 'last4') {
		const dowIndex = getISODayOfWeek(entry.date);
		bucket.dowLast4.total[dowIndex]++;
		if (entry.completed) bucket.dowLast4.completed[dowIndex]++;
	}
}

function toPct(completed: number, total: number): number {
	return total > 0 ? Math.round((completed / total) * 100) : 0;
}

function toDowCompletionPct(bucket: ItemBucket): number[] {
	return bucket.dowLast4.total.map((tot, i) =>
		tot > 0 ? Math.round((bucket.dowLast4.completed[i] / tot) * 100) : -1
	);
}

function toAgendaItemStat(bucket: ItemBucket): AgendaItemStat {
	return {
		title: bucket.title,
		completionPct: toPct(bucket.last4.completed, bucket.last4.total),
		prevCompletionPct: toPct(bucket.prev4.completed, bucket.prev4.total),
		dowCompletionPct: toDowCompletionPct(bucket),
		last4Days: bucket.last4.total
	};
}

export function buildAgendaItemStats(
	entries: AgendaTrendEntry[],
	ranges: DashboardDateRanges
): AgendaItemStat[] {
	const itemBuckets = new Map<string, ItemBucket>();

	for (const entry of entries) {
		const window = getAgendaRangeWindow(entry.date, ranges);
		if (!window) continue;
		const groupKey = entry.templateGroupId ?? entry.title;
		const bucket = getOrCreateItemBucket(itemBuckets, groupKey, entry);
		addEntryToBucket(bucket, entry, window);
	}

	return Array.from(itemBuckets.values())
		.filter((b) => b.last4.total + b.prev4.total >= 7)
		.map(toAgendaItemStat)
		.sort((a, b) => a.completionPct - b.completionPct);
}
