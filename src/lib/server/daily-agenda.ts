import { and, asc, eq, gte, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { dailyAgendaEntries, dailyAgendaTemplates } from '$lib/server/db/schema';
import { generateId } from '$lib/server/db/utils';
import type {
	DailyAgendaChartPoint,
	DailyAgendaData,
	DailyAgendaDay,
	DailyAgendaEntry,
	DailyAgendaTemplate
} from '$lib/types';
import {
	addDaysToDateString,
	getRollingDateRange,
	getStartOfWeek,
	getTodayString,
	getWeekDates,
	parseLocalDateString
} from '$lib/utils/date';

const DEFAULT_SOURCE = 'default' as const;
const CUSTOM_SOURCE = 'custom' as const;
const EVERY_DAY_TEMPLATE_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

type DailyAgendaTemplateRecord = typeof dailyAgendaTemplates.$inferSelect;
type DailyAgendaEntryRecord = typeof dailyAgendaEntries.$inferSelect;

export class DailyAgendaMutationError extends Error {
	constructor(
		message: string,
		public readonly code: 'invalid_source' | 'not_found' | 'read_only'
	) {
		super(message);
	}
}

function assertDateIsEditable(date: string): void {
	if (date < getTodayString()) {
		throw new DailyAgendaMutationError('Historical items are read only', 'read_only');
	}
}

function calculateCompletionPercentage(entries: Array<{ completed: boolean }>): number {
	if (entries.length === 0) {
		return 0;
	}

	const completedCount = entries.filter((entry) => entry.completed).length;
	return Math.round((completedCount / entries.length) * 100);
}

function buildDateRangeLabel(startDate: string, endDate: string): string {
	const start = parseLocalDateString(startDate);
	const end = parseLocalDateString(endDate);

	const startLabel = start.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric'
	});
	const endLabel = end.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});

	return `${startLabel} - ${endLabel}`;
}

function normalizeTemplateDays(daysOfWeek: number[]): number[] {
	const normalizedDays = Array.from(new Set(daysOfWeek))
		.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
		.sort((left, right) => left - right);

	return normalizedDays.length > 0 ? normalizedDays : [...EVERY_DAY_TEMPLATE_DAYS];
}

function parseTemplateDays(daysOfWeek: string): number[] {
	try {
		const parsed = JSON.parse(daysOfWeek);
		if (!Array.isArray(parsed)) {
			return [...EVERY_DAY_TEMPLATE_DAYS];
		}

		const numericDays = parsed.filter((day): day is number => typeof day === 'number');
		return normalizeTemplateDays(numericDays);
	} catch {
		return [...EVERY_DAY_TEMPLATE_DAYS];
	}
}

function serializeTemplateDays(daysOfWeek: number[]): string {
	return JSON.stringify(normalizeTemplateDays(daysOfWeek));
}

function getEntriesToDeleteForDays(
	entries: Array<{ id: string; date: string }>,
	allowedDays: number[]
): string[] {
	const allowedDaySet = new Set(allowedDays);

	return entries
		.filter((entry) => !allowedDaySet.has(parseLocalDateString(entry.date).getDay()))
		.map((entry) => entry.id);
}

function mapTemplateRecord(template: DailyAgendaTemplateRecord): DailyAgendaTemplate {
	return {
		id: template.id,
		templateGroupId: template.templateGroupId,
		title: template.title,
		sortOrder: template.sortOrder,
		daysOfWeek: parseTemplateDays(template.daysOfWeek),
		startsOn: template.startsOn,
		endsOn: template.endsOn ?? null
	};
}

function mapEntryRecord(entry: DailyAgendaEntryRecord): DailyAgendaEntry {
	return {
		id: entry.id,
		templateId: entry.templateId ?? null,
		templateGroupId: entry.templateGroupId ?? null,
		date: entry.date,
		title: entry.title,
		sourceType: entry.sourceType as DailyAgendaEntry['sourceType'],
		sortOrder: entry.sortOrder,
		completed: entry.completed,
		completedAt: entry.completedAt ?? null
	};
}

function isTemplateActiveOnDate(template: DailyAgendaTemplateRecord, date: string): boolean {
	if (template.startsOn > date || (template.endsOn && template.endsOn < date)) {
		return false;
	}

	const dayOfWeek = parseLocalDateString(date).getDay();
	const allowedDays = parseTemplateDays(template.daysOfWeek);
	return allowedDays.includes(dayOfWeek);
}

function sortAgendaEntriesForDisplay(entries: DailyAgendaEntry[]): DailyAgendaEntry[] {
	return entries
		.map((entry, index) => ({ entry, index }))
		.sort((left, right) => {
			if (left.entry.sourceType !== right.entry.sourceType) {
				return left.entry.sourceType === DEFAULT_SOURCE ? -1 : 1;
			}

			if (left.entry.sortOrder !== right.entry.sortOrder) {
				return left.entry.sortOrder - right.entry.sortOrder;
			}

			return left.index - right.index;
		})
		.map(({ entry }) => entry);
}

async function getActiveTemplatesForDate(
	userId: string,
	date: string
): Promise<DailyAgendaTemplate[]> {
	const rows = await getDb().query.dailyAgendaTemplates.findMany({
		where: and(
			eq(dailyAgendaTemplates.userId, userId),
			lte(dailyAgendaTemplates.startsOn, date),
			or(isNull(dailyAgendaTemplates.endsOn), gte(dailyAgendaTemplates.endsOn, date))
		),
		orderBy: [asc(dailyAgendaTemplates.sortOrder), asc(dailyAgendaTemplates.createdAt)]
	});

	return rows.map(mapTemplateRecord);
}

async function ensureDefaultEntriesForDates(userId: string, dates: string[]): Promise<void> {
	const uniqueDates = Array.from(new Set(dates)).sort((left, right) => left.localeCompare(right));

	if (uniqueDates.length === 0) {
		return;
	}

	const db = getDb();
	const rangeStart = uniqueDates.at(0);
	const rangeEnd = uniqueDates.at(-1);

	if (!rangeStart || !rangeEnd) {
		return;
	}

	const templateRows = await db.query.dailyAgendaTemplates.findMany({
		where: and(
			eq(dailyAgendaTemplates.userId, userId),
			lte(dailyAgendaTemplates.startsOn, rangeEnd),
			or(isNull(dailyAgendaTemplates.endsOn), gte(dailyAgendaTemplates.endsOn, rangeStart))
		),
		orderBy: [asc(dailyAgendaTemplates.sortOrder), asc(dailyAgendaTemplates.createdAt)]
	});

	if (templateRows.length === 0) {
		return;
	}

	const existingDefaultEntries = await db.query.dailyAgendaEntries.findMany({
		where: and(
			eq(dailyAgendaEntries.userId, userId),
			inArray(dailyAgendaEntries.date, uniqueDates),
			eq(dailyAgendaEntries.sourceType, DEFAULT_SOURCE)
		),
		columns: {
			date: true,
			templateGroupId: true
		}
	});

	const existingKeys = new Set(
		existingDefaultEntries
			.filter((entry) => entry.templateGroupId)
			.map((entry) => `${entry.templateGroupId}:${entry.date}`)
	);

	const timestamp = new Date().toISOString();
	const inserts = [] as Array<typeof dailyAgendaEntries.$inferInsert>;

	for (const template of templateRows) {
		for (const date of uniqueDates) {
			if (!isTemplateActiveOnDate(template, date)) {
				continue;
			}

			const key = `${template.templateGroupId}:${date}`;
			if (existingKeys.has(key)) {
				continue;
			}

			inserts.push({
				id: generateId(),
				userId,
				templateId: template.id,
				templateGroupId: template.templateGroupId,
				date,
				title: template.title,
				sourceType: DEFAULT_SOURCE,
				sortOrder: template.sortOrder,
				completed: false,
				createdAt: timestamp,
				updatedAt: timestamp
			});
			existingKeys.add(key);
		}
	}

	if (inserts.length === 0) {
		return;
	}

	await db
		.insert(dailyAgendaEntries)
		.values(inserts)
		.onConflictDoNothing({
			target: [
				dailyAgendaEntries.userId,
				dailyAgendaEntries.templateGroupId,
				dailyAgendaEntries.date
			]
		});
}

export async function loadDailyAgendaData(
	userId: string,
	requestedWeekStart?: string
): Promise<DailyAgendaData> {
	const today = getTodayString();
	const weekStart = getStartOfWeek(requestedWeekStart ?? today);
	const weekDates = getWeekDates(weekStart);
	const weekEnd = weekDates.at(-1) ?? weekStart;
	const chartDates = getRollingDateRange(weekEnd, 14);
	const datesToEnsure = Array.from(new Set([...weekDates, ...chartDates]));

	await ensureDefaultEntriesForDates(userId, datesToEnsure);

	const entryRows = await getDb().query.dailyAgendaEntries.findMany({
		where: and(
			eq(dailyAgendaEntries.userId, userId),
			inArray(dailyAgendaEntries.date, datesToEnsure)
		),
		orderBy: [
			asc(dailyAgendaEntries.date),
			asc(dailyAgendaEntries.sortOrder),
			asc(dailyAgendaEntries.createdAt)
		]
	});

	const entriesByDate = new Map<string, DailyAgendaEntry[]>();
	for (const row of entryRows) {
		const mappedEntry = mapEntryRecord(row);
		const dayEntries = entriesByDate.get(mappedEntry.date) ?? [];
		dayEntries.push(mappedEntry);
		entriesByDate.set(mappedEntry.date, dayEntries);
	}

	for (const [date, entries] of entriesByDate) {
		entriesByDate.set(date, sortAgendaEntriesForDisplay(entries));
	}

	const days: DailyAgendaDay[] = weekDates.map((date) => {
		const parsedDate = parseLocalDateString(date);
		const entries = entriesByDate.get(date) ?? [];
		const completedCount = entries.filter((entry) => entry.completed).length;
		const totalCount = entries.length;

		return {
			date,
			dayName: parsedDate.toLocaleDateString('en-US', { weekday: 'long' }),
			shortDayName: parsedDate.toLocaleDateString('en-US', { weekday: 'short' }),
			dayOfWeek: parsedDate.getDay(),
			dayNumber: parsedDate.getDate(),
			monthLabel: parsedDate.toLocaleDateString('en-US', {
				month: 'long'
			}),
			isToday: date === today,
			isWeekend: parsedDate.getDay() === 0 || parsedDate.getDay() === 6,
			isEditable: date >= today,
			completionPercentage: calculateCompletionPercentage(entries),
			completedCount,
			totalCount,
			entries
		};
	});

	const chartPoints: DailyAgendaChartPoint[] = chartDates.map((date) => {
		const entries = entriesByDate.get(date) ?? [];
		const completedCount = entries.filter((entry) => entry.completed).length;
		return {
			date,
			completionPercentage: calculateCompletionPercentage(entries),
			completedCount,
			totalCount: entries.length
		};
	});

	const overallTotalCount = days.reduce((total, day) => total + day.totalCount, 0);
	const overallCompletedCount = days.reduce((total, day) => total + day.completedCount, 0);

	return {
		weekStart,
		weekEnd,
		weekLabel: buildDateRangeLabel(weekStart, weekEnd),
		previousWeekStart: addDaysToDateString(weekStart, -7),
		nextWeekStart: addDaysToDateString(weekStart, 7),
		chartRangeLabel: buildDateRangeLabel(
			chartDates.at(0) ?? weekStart,
			chartDates.at(-1) ?? chartDates.at(0) ?? weekStart
		),
		isCurrentWeek: weekStart === getStartOfWeek(today),
		overallCompletionPercentage:
			overallTotalCount === 0 ? 0 : Math.round((overallCompletedCount / overallTotalCount) * 100),
		overallCompletedCount,
		overallTotalCount,
		days,
		templates: await getActiveTemplatesForDate(userId, today),
		chartPoints
	};
}

export async function loadDailyAgendaEntriesForDate(
	userId: string,
	date: string
): Promise<DailyAgendaEntry[]> {
	await ensureDefaultEntriesForDates(userId, [date]);

	const rows = await getDb().query.dailyAgendaEntries.findMany({
		where: and(eq(dailyAgendaEntries.userId, userId), eq(dailyAgendaEntries.date, date)),
		orderBy: [asc(dailyAgendaEntries.sortOrder), asc(dailyAgendaEntries.createdAt)]
	});

	const entries = rows.map(mapEntryRecord);
	return sortAgendaEntriesForDisplay(entries);
}

export async function createDailyAgendaTemplate(
	userId: string,
	title: string,
	daysOfWeek: number[]
): Promise<void> {
	const db = getDb();
	const today = getTodayString();
	const timestamp = new Date().toISOString();
	const serializedDays = serializeTemplateDays(daysOfWeek);

	await db.transaction(async (tx) => {
		const [sortOrderRow] = await tx
			.select({
				maxSortOrder: sql<number>`coalesce(max(${dailyAgendaTemplates.sortOrder}), -1)`
			})
			.from(dailyAgendaTemplates)
			.where(
				and(
					eq(dailyAgendaTemplates.userId, userId),
					lte(dailyAgendaTemplates.startsOn, today),
					or(isNull(dailyAgendaTemplates.endsOn), gte(dailyAgendaTemplates.endsOn, today))
				)
			);

		const templateGroupId = generateId();
		await tx.insert(dailyAgendaTemplates).values({
			id: generateId(),
			templateGroupId,
			userId,
			title,
			sortOrder: (sortOrderRow?.maxSortOrder ?? -1) + 1,
			daysOfWeek: serializedDays,
			startsOn: today,
			createdAt: timestamp,
			updatedAt: timestamp
		});
	});
}

export async function updateDailyAgendaTemplate(
	userId: string,
	templateId: string,
	title: string,
	daysOfWeek: number[]
): Promise<void> {
	const db = getDb();
	const today = getTodayString();
	const timestamp = new Date().toISOString();
	const normalizedDays = normalizeTemplateDays(daysOfWeek);
	const serializedDays = JSON.stringify(normalizedDays);

	await db.transaction(async (tx) => {
		const existing = await tx.query.dailyAgendaTemplates.findFirst({
			where: and(
				eq(dailyAgendaTemplates.id, templateId),
				eq(dailyAgendaTemplates.userId, userId),
				lte(dailyAgendaTemplates.startsOn, today),
				or(isNull(dailyAgendaTemplates.endsOn), gte(dailyAgendaTemplates.endsOn, today))
			)
		});

		if (!existing) {
			throw new DailyAgendaMutationError('Default item not found', 'not_found');
		}

		if (existing.startsOn === today) {
			await tx
				.update(dailyAgendaTemplates)
				.set({ title, daysOfWeek: serializedDays, updatedAt: timestamp })
				.where(eq(dailyAgendaTemplates.id, existing.id));

			const futureDefaultEntries = await tx.query.dailyAgendaEntries.findMany({
				where: and(
					eq(dailyAgendaEntries.userId, userId),
					eq(dailyAgendaEntries.templateGroupId, existing.templateGroupId),
					eq(dailyAgendaEntries.sourceType, DEFAULT_SOURCE),
					gte(dailyAgendaEntries.date, today)
				),
				columns: {
					id: true,
					date: true
				}
			});

			const entriesToDelete = getEntriesToDeleteForDays(futureDefaultEntries, normalizedDays);
			if (entriesToDelete.length > 0) {
				await tx.delete(dailyAgendaEntries).where(inArray(dailyAgendaEntries.id, entriesToDelete));
			}

			await tx
				.update(dailyAgendaEntries)
				.set({ title, updatedAt: timestamp })
				.where(
					and(
						eq(dailyAgendaEntries.userId, userId),
						eq(dailyAgendaEntries.templateGroupId, existing.templateGroupId),
						eq(dailyAgendaEntries.sourceType, DEFAULT_SOURCE),
						gte(dailyAgendaEntries.date, today)
					)
				);

			return;
		}

		const nextVersionId = generateId();
		await tx
			.update(dailyAgendaTemplates)
			.set({ endsOn: addDaysToDateString(today, -1), updatedAt: timestamp })
			.where(eq(dailyAgendaTemplates.id, existing.id));

		await tx.insert(dailyAgendaTemplates).values({
			id: nextVersionId,
			templateGroupId: existing.templateGroupId,
			userId,
			title,
			sortOrder: existing.sortOrder,
			daysOfWeek: serializedDays,
			startsOn: today,
			createdAt: timestamp,
			updatedAt: timestamp
		});

		const futureDefaultEntries = await tx.query.dailyAgendaEntries.findMany({
			where: and(
				eq(dailyAgendaEntries.userId, userId),
				eq(dailyAgendaEntries.templateGroupId, existing.templateGroupId),
				eq(dailyAgendaEntries.sourceType, DEFAULT_SOURCE),
				gte(dailyAgendaEntries.date, today)
			),
			columns: {
				id: true,
				date: true
			}
		});

		const entriesToDelete = getEntriesToDeleteForDays(futureDefaultEntries, normalizedDays);
		if (entriesToDelete.length > 0) {
			await tx.delete(dailyAgendaEntries).where(inArray(dailyAgendaEntries.id, entriesToDelete));
		}

		await tx
			.update(dailyAgendaEntries)
			.set({
				templateId: nextVersionId,
				title,
				sortOrder: existing.sortOrder,
				updatedAt: timestamp
			})
			.where(
				and(
					eq(dailyAgendaEntries.userId, userId),
					eq(dailyAgendaEntries.templateGroupId, existing.templateGroupId),
					eq(dailyAgendaEntries.sourceType, DEFAULT_SOURCE),
					gte(dailyAgendaEntries.date, today)
				)
			);
	});
}

export async function deleteDailyAgendaTemplate(userId: string, templateId: string): Promise<void> {
	const db = getDb();
	const today = getTodayString();
	const timestamp = new Date().toISOString();

	await db.transaction(async (tx) => {
		const existing = await tx.query.dailyAgendaTemplates.findFirst({
			where: and(
				eq(dailyAgendaTemplates.id, templateId),
				eq(dailyAgendaTemplates.userId, userId),
				lte(dailyAgendaTemplates.startsOn, today),
				or(isNull(dailyAgendaTemplates.endsOn), gte(dailyAgendaTemplates.endsOn, today))
			)
		});

		if (!existing) {
			throw new DailyAgendaMutationError('Default item not found', 'not_found');
		}

		await tx
			.delete(dailyAgendaEntries)
			.where(
				and(
					eq(dailyAgendaEntries.userId, userId),
					eq(dailyAgendaEntries.templateGroupId, existing.templateGroupId),
					eq(dailyAgendaEntries.sourceType, DEFAULT_SOURCE),
					gte(dailyAgendaEntries.date, today)
				)
			);

		if (existing.startsOn === today) {
			await tx.delete(dailyAgendaTemplates).where(eq(dailyAgendaTemplates.id, existing.id));
			return;
		}

		await tx
			.update(dailyAgendaTemplates)
			.set({ endsOn: addDaysToDateString(today, -1), updatedAt: timestamp })
			.where(eq(dailyAgendaTemplates.id, existing.id));
	});
}

export async function createDailyAgendaCustomEntry(
	userId: string,
	input: { date: string; title: string }
): Promise<void> {
	assertDateIsEditable(input.date);

	const db = getDb();
	const timestamp = new Date().toISOString();

	await db.transaction(async (tx) => {
		const [sortOrderRow] = await tx
			.select({
				maxSortOrder: sql<number>`coalesce(max(${dailyAgendaEntries.sortOrder}), -1)`
			})
			.from(dailyAgendaEntries)
			.where(and(eq(dailyAgendaEntries.userId, userId), eq(dailyAgendaEntries.date, input.date)));

		await tx.insert(dailyAgendaEntries).values({
			id: generateId(),
			userId,
			date: input.date,
			title: input.title,
			sourceType: CUSTOM_SOURCE,
			sortOrder: (sortOrderRow?.maxSortOrder ?? -1) + 1,
			completed: false,
			createdAt: timestamp,
			updatedAt: timestamp
		});
	});
}

export async function updateDailyAgendaCustomEntry(
	userId: string,
	entryId: string,
	title: string
): Promise<void> {
	const db = getDb();
	const existing = await db.query.dailyAgendaEntries.findFirst({
		where: and(eq(dailyAgendaEntries.id, entryId), eq(dailyAgendaEntries.userId, userId))
	});

	if (!existing) {
		throw new DailyAgendaMutationError('Agenda item not found', 'not_found');
	}

	assertDateIsEditable(existing.date);

	if (existing.sourceType !== CUSTOM_SOURCE) {
		throw new DailyAgendaMutationError('Only custom items can be edited here', 'invalid_source');
	}

	await db
		.update(dailyAgendaEntries)
		.set({ title, updatedAt: new Date().toISOString() })
		.where(eq(dailyAgendaEntries.id, entryId));
}

export async function deleteDailyAgendaCustomEntry(userId: string, entryId: string): Promise<void> {
	const db = getDb();
	const existing = await db.query.dailyAgendaEntries.findFirst({
		where: and(eq(dailyAgendaEntries.id, entryId), eq(dailyAgendaEntries.userId, userId))
	});

	if (!existing) {
		throw new DailyAgendaMutationError('Agenda item not found', 'not_found');
	}

	assertDateIsEditable(existing.date);

	if (existing.sourceType !== CUSTOM_SOURCE) {
		throw new DailyAgendaMutationError('Only custom items can be deleted here', 'invalid_source');
	}

	await db.delete(dailyAgendaEntries).where(eq(dailyAgendaEntries.id, entryId));
}

export async function toggleDailyAgendaEntry(
	userId: string,
	entryId: string,
	completed: boolean
): Promise<void> {
	const db = getDb();
	const existing = await db.query.dailyAgendaEntries.findFirst({
		where: and(eq(dailyAgendaEntries.id, entryId), eq(dailyAgendaEntries.userId, userId))
	});

	if (!existing) {
		throw new DailyAgendaMutationError('Agenda item not found', 'not_found');
	}

	assertDateIsEditable(existing.date);

	await db
		.update(dailyAgendaEntries)
		.set({
			completed,
			completedAt: completed ? new Date().toISOString() : null,
			updatedAt: new Date().toISOString()
		})
		.where(eq(dailyAgendaEntries.id, entryId));
}
