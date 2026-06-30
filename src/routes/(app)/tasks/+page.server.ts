import {
	createDailyAgendaEntrySchema,
	createDailyAgendaTemplateSchema,
	dailyAgendaPageQuerySchema,
	deleteDailyAgendaEntrySchema,
	deleteDailyAgendaTemplateSchema,
	toggleDailyAgendaEntrySchema,
	updateDailyAgendaEntrySchema,
	updateDailyAgendaTemplateSchema
} from '$lib/schemas/daily-agenda';
import { moodLogSchema, moodPeriodSchema } from '$lib/schemas/mood';
import type { TaskState } from '$lib/schemas/task';
import {
	deleteTaskSchema,
	moveTaskBoardSchema,
	taskFilterSchema,
	updateTaskStateSchema
} from '$lib/schemas/task';
import { getUser, requireAuth } from '$lib/server/actions/auth-guard';
import {
	createDailyAgendaCustomEntry,
	createDailyAgendaTemplate,
	DailyAgendaMutationError,
	deleteDailyAgendaCustomEntry,
	deleteDailyAgendaTemplate,
	loadDailyAgendaData,
	toggleDailyAgendaEntry,
	updateDailyAgendaCustomEntry,
	updateDailyAgendaTemplate
} from '$lib/server/daily-agenda';
import { getDb } from '$lib/server/db';
import { moodLogs, tasks } from '$lib/server/db/schema';
import {
	generateId,
	withAuditFieldsForCreate,
	withAuditFieldsForUpdate
} from '$lib/server/db/utils';
import {
	addDaysToDateString,
	formatDateShort,
	getDateRange,
	getDateUrgencyStatus,
	getISODayOfWeek,
	getStartOfMonth,
	getStartOfQuarter,
	getStartOfWeek,
	getTodayString
} from '$lib/utils/date';
import { logger } from '$lib/utils/logger';
import {
	getMoodChartColor,
	getMoodScore,
	normalizeOptionalMoodText,
	resolveMoodLabel
} from '$lib/utils/mood';
import { fail, redirect } from '@sveltejs/kit';
import { and, asc, eq, gte, like, lte, or } from 'drizzle-orm';
import { message, setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

type AgendaActionScope =
	| 'create-template'
	| 'update-template'
	| 'delete-template'
	| 'create-entry'
	| 'update-entry'
	| 'delete-entry'
	| 'toggle-entry';

type AgendaActionPayload = {
	scope: AgendaActionScope;
	type: 'success' | 'error' | 'validation-error';
	text: string;
	fieldErrors?: unknown;
	values?: Record<string, unknown>;
	entityId?: string;
	date?: string;
};

function buildAgendaActionPayload(
	scope: AgendaActionScope,
	payload: Omit<AgendaActionPayload, 'scope'>
) {
	return {
		agendaAction: {
			scope,
			...payload
		}
	};
}

function failAgendaValidation(
	scope: AgendaActionScope,
	form: Awaited<ReturnType<typeof superValidate>>,
	extra: Partial<AgendaActionPayload> = {}
) {
	return fail(
		400,
		buildAgendaActionPayload(scope, {
			type: 'validation-error',
			text: 'Please correct the highlighted fields.',
			fieldErrors: form.errors,
			values: form.data,
			...extra
		})
	);
}

function failAgendaMutation(
	scope: AgendaActionScope,
	error: unknown,
	context: {
		userId: string;
		entityId?: string;
		date?: string;
		message: string;
		logMessage: string;
	}
) {
	if (error instanceof DailyAgendaMutationError) {
		const status = error.code === 'not_found' ? 404 : 400;
		return fail(
			status,
			buildAgendaActionPayload(scope, {
				type: 'error',
				text: error.message,
				entityId: context.entityId,
				date: context.date
			})
		);
	}

	logger.error(context.logMessage, error, {
		userId: context.userId,
		entityId: context.entityId,
		date: context.date
	});

	return fail(
		500,
		buildAgendaActionPayload(scope, {
			type: 'error',
			text: context.message,
			entityId: context.entityId,
			date: context.date
		})
	);
}

function getSelectedPeriod(value: string | null): 'week' | 'month' | 'quarter' {
	const parsed = moodPeriodSchema.safeParse(value ?? 'week');
	return parsed.success ? parsed.data : 'week';
}

function getMoodRangeStart(today: string, period: 'week' | 'month' | 'quarter'): string {
	if (period === 'month') return getStartOfMonth(today);
	if (period === 'quarter') return getStartOfQuarter(today);
	return getStartOfWeek(today);
}

async function buildMoodForm(todayMoodLog?: typeof moodLogs.$inferSelect | null) {
	const today = getTodayString();
	return superValidate(
		{
			date: todayMoodLog?.date ?? today,
			mood: todayMoodLog?.mood ?? '',
			customMood: todayMoodLog?.customMood ?? '',
			notes: todayMoodLog?.notes ?? ''
		},
		zod4(moodLogSchema)
	);
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function buildWeekdayAvg(
	entries: { date: string; mood: string }[]
): { day: string; avgScore: number | null; count: number }[] {
	const weekdayScores: number[][] = Array.from({ length: 7 }, () => []);

	for (const entry of entries) {
		// Mon=0…Sun=6
		const dayIndex = getISODayOfWeek(entry.date);
		weekdayScores[dayIndex].push(getMoodScore(entry.mood));
	}

	return WEEKDAY_LABELS.map((day, index) => ({
		day,
		avgScore:
			weekdayScores[index].length > 0
				? Number(
						(weekdayScores[index].reduce((s, v) => s + v, 0) / weekdayScores[index].length).toFixed(
							1
						)
					)
				: null,
		count: weekdayScores[index].length
	}));
}

/**
 * Get all unique tags across the user's tasks
 */
async function getAllTags(userId: string): Promise<string[]> {
	const taskRows = await getDb().query.tasks.findMany({
		where: eq(tasks.userId, userId),
		columns: { tags: true }
	});

	const tagSet = new Set<string>();
	for (const task of taskRows) {
		if (task.tags) {
			try {
				const tagArray = JSON.parse(task.tags);
				if (Array.isArray(tagArray)) {
					for (const tag of tagArray) {
						tagSet.add(tag);
					}
				}
			} catch {
				// Skip invalid JSON
			}
		}
	}

	return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
}

function parseStoredTags(rawTags: string | null): string[] | null {
	if (!rawTags) {
		return null;
	}

	try {
		const parsed = JSON.parse(rawTags);
		return Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

type TaskBoardClient = Pick<ReturnType<typeof getDb>, 'select' | 'update'>;

function clampBoardIndex(index: number, maxLength: number): number {
	if (index < 0) {
		return 0;
	}

	if (index > maxLength) {
		return maxLength;
	}

	return index;
}

function moveTaskIdToIndex(taskIds: string[], taskId: string, targetIndex: number): string[] {
	const reorderedTaskIds = taskIds.filter((id) => id !== taskId);
	const safeIndex = clampBoardIndex(targetIndex, reorderedTaskIds.length);
	reorderedTaskIds.splice(safeIndex, 0, taskId);
	return reorderedTaskIds;
}

function getCompletedAtForTaskStateChange(
	fromState: TaskState,
	toState: TaskState,
	timestamp: string
): string | null | undefined {
	if (fromState !== 'done' && toState === 'done') {
		return timestamp;
	}

	if (fromState === 'done' && toState !== 'done') {
		return null;
	}

	return undefined;
}

function loadTaskIdsByState(db: TaskBoardClient, userId: string, state: TaskState): string[] {
	const rows = db
		.select({ id: tasks.id })
		.from(tasks)
		.where(and(eq(tasks.userId, userId), eq(tasks.state, state)))
		.orderBy(asc(tasks.sortOrder), asc(tasks.taskNumber))
		.all();

	return rows.map((row) => row.id);
}

function applyTaskSortOrder(
	db: TaskBoardClient,
	userId: string,
	taskIds: string[],
	timestamp: string
): void {
	for (let index = 0; index < taskIds.length; index += 1) {
		db.update(tasks)
			.set({
				sortOrder: index,
				updatedAt: timestamp
			})
			.where(and(eq(tasks.id, taskIds[index]), eq(tasks.userId, userId)))
			.run();
	}
}

type MoveTaskWithinBoardResult = {
	fromState: TaskState;
	toState: TaskState;
};

function moveTaskWithinBoard(
	db: TaskBoardClient,
	userId: string,
	taskId: string,
	toState: TaskState,
	toIndex: number,
	timestamp: string
): MoveTaskWithinBoardResult | null {
	const existing = db
		.select({ id: tasks.id, state: tasks.state })
		.from(tasks)
		.where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
		.get();

	if (!existing) {
		return null;
	}

	const fromState = existing.state as TaskState;

	if (fromState === toState) {
		const columnTaskIds = loadTaskIdsByState(db, userId, toState);
		const reorderedTaskIds = moveTaskIdToIndex(columnTaskIds, taskId, toIndex);
		applyTaskSortOrder(db, userId, reorderedTaskIds, timestamp);
		return { fromState, toState };
	}

	const sourceTaskIds = loadTaskIdsByState(db, userId, fromState);
	const targetTaskIds = loadTaskIdsByState(db, userId, toState);

	const nextSourceTaskIds = sourceTaskIds.filter((id) => id !== taskId);
	const nextTargetTaskIds = moveTaskIdToIndex(targetTaskIds, taskId, toIndex);

	const completedAt = getCompletedAtForTaskStateChange(fromState, toState, timestamp);
	const stateUpdate: {
		state: TaskState;
		updatedAt: string;
		completedAt?: string | null;
	} = {
		state: toState,
		updatedAt: timestamp
	};

	if (completedAt !== undefined) {
		stateUpdate.completedAt = completedAt;
	}

	db.update(tasks)
		.set(stateUpdate)
		.where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
		.run();

	applyTaskSortOrder(db, userId, nextSourceTaskIds, timestamp);
	applyTaskSortOrder(db, userId, nextTargetTaskIds, timestamp);

	return { fromState, toState };
}

async function loadTaskBoardData(
	userId: string,
	filters: {
		keyword?: string;
		priority: number[];
		tag: string[];
		state?: TaskState;
		dueDate: ('overdue' | 'today' | 'upcoming')[];
	}
) {
	const conditions = [eq(tasks.userId, userId)];

	if (filters.state) {
		conditions.push(eq(tasks.state, filters.state));
	}

	if (filters.priority.length > 0) {
		const priorityCondition = or(...filters.priority.map((value) => eq(tasks.priority, value)));
		if (priorityCondition) {
			conditions.push(priorityCondition);
		}
	}

	if (filters.keyword) {
		const keywordPattern = `%${filters.keyword}%`;
		const keywordCondition = or(
			like(tasks.title, keywordPattern),
			like(tasks.description, keywordPattern)
		);
		if (keywordCondition) {
			conditions.push(keywordCondition);
		}
	}

	if (filters.tag.length > 0) {
		const tagCondition = or(...filters.tag.map((value) => like(tasks.tags, `%"${value}"%`)));
		if (tagCondition) {
			conditions.push(tagCondition);
		}
	}

	let taskRows = await getDb().query.tasks.findMany({
		where: and(...conditions),
		orderBy: [tasks.state, tasks.sortOrder, tasks.priority, tasks.dueDate, tasks.taskNumber]
	});

	// Apply due date filtering after database query since we need to calculate urgency status
	if (filters.dueDate.length > 0) {
		const today = getTodayString();
		taskRows = taskRows.filter((task) => {
			const urgencyStatus = getDateUrgencyStatus(task.dueDate, today);
			return urgencyStatus && filters.dueDate.includes(urgencyStatus);
		});
	}

	return taskRows.map((task) => ({
		...task,
		taskNumber: task.taskNumber,
		state: task.state as TaskState,
		tags: parseStoredTags(task.tags)
	}));
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const userId = getUser(locals).id;
	const today = getTodayString();

	const pageState = dailyAgendaPageQuerySchema.safeParse({
		tab: url.searchParams.get('tab') ?? undefined,
		week: url.searchParams.get('week') ?? undefined
	});
	const activeTab = pageState.success ? pageState.data.tab : 'kanban';
	const agendaWeek = pageState.success ? pageState.data.week : getStartOfWeek();
	const agenda = userId ? await loadDailyAgendaData(userId, agendaWeek) : null;
	const filters = taskFilterSchema.safeParse({
		keyword: url.searchParams.get('keyword') ?? undefined,
		priority: url.searchParams.get('priority') ?? undefined,
		tag: url.searchParams.get('tag') ?? undefined,
		state: url.searchParams.get('state') ?? undefined,
		dueDate: url.searchParams.get('dueDate') ?? undefined
	});

	// Mood range vars are only needed when the mood tab is active — compute lazily.
	const selectedPeriod =
		activeTab === 'mood' ? getSelectedPeriod(url.searchParams.get('period')) : 'week';
	const moodRangeStart = activeTab === 'mood' ? getMoodRangeStart(today, selectedPeriod) : today;
	const moodRangeDates = activeTab === 'mood' ? getDateRange(moodRangeStart, today) : [];
	const calendarMonthStart = activeTab === 'mood' ? getStartOfMonth(today) : today;
	const rangeLabel =
		activeTab === 'mood' ? `${formatDateShort(moodRangeStart)} – ${formatDateShort(today)}` : '';

	const emptyMood = {
		selectedPeriod,
		rangeLabel,
		trendPoints: [] as {
			date: string;
			score: number;
			resolvedMood: string;
			mood: string;
			isCustom: boolean;
			fill: string;
		}[],
		rollingAvgPoints: [] as { date: string; rollingAvg: number }[],
		distribution: [] as { mood: string; count: number; fill: string; percentage: number }[],
		weekdayAvg: buildWeekdayAvg([]),
		calendarLogs: [] as { date: string; score: number; resolvedMood: string; fill: string }[],
		todayLog: null as {
			date: string;
			mood: string;
			resolvedMood: string;
			notes: string | null;
		} | null,
		summary: {
			loggedDays: 0,
			totalDays: moodRangeDates.length,
			coveragePercentage: 0,
			currentStreak: 0,
			mostFrequentMood: null as string | null,
			averageScore: null as number | null
		}
	};

	if (!filters.success) {
		logger.error('Invalid task filter parameters', { error: filters.error, userId });

		return {
			activeTab,
			agenda,
			tasks: [],
			allTags: userId ? await getAllTags(userId) : [],
			moodForm: await buildMoodForm(),
			mood: emptyMood
		};
	}

	try {
		const db = getDb();

		if (activeTab !== 'mood') {
			const [tasksWithParsedFields, allTags] = await Promise.all([
				loadTaskBoardData(userId, filters.data),
				getAllTags(userId)
			]);

			return {
				activeTab,
				agenda,
				tasks: tasksWithParsedFields,
				allTags,
				moodForm: await buildMoodForm(),
				mood: emptyMood
			};
		}

		const [tasksWithParsedFields, allTags, moodEntries, calendarEntries] = await Promise.all([
			loadTaskBoardData(userId, filters.data),
			getAllTags(userId),
			db.query.moodLogs.findMany({
				where: and(
					eq(moodLogs.userId, userId),
					gte(moodLogs.date, moodRangeStart),
					lte(moodLogs.date, today)
				),
				orderBy: [asc(moodLogs.date)]
			}),
			db.query.moodLogs.findMany({
				where: and(
					eq(moodLogs.userId, userId),
					gte(moodLogs.date, calendarMonthStart),
					lte(moodLogs.date, today)
				),
				orderBy: [asc(moodLogs.date)]
			})
		]);

		const todayLog = moodEntries.find((e) => e.date === today) ?? null;
		const moodForm = await buildMoodForm(todayLog);

		const trendPoints = moodEntries.map((entry) => ({
			date: entry.date,
			score: getMoodScore(entry.mood),
			resolvedMood: resolveMoodLabel(entry.mood, entry.customMood),
			mood: entry.mood,
			isCustom: entry.mood === 'custom',
			fill: getMoodChartColor(entry.mood)
		}));

		// Rolling 7-day average: average over available logged points only (no interpolation)
		const rollingAvgPoints: { date: string; rollingAvg: number }[] = [];
		let windowStartIndex = 0;
		let windowScoreSum = 0;

		for (let pointIndex = 0; pointIndex < trendPoints.length; pointIndex += 1) {
			const point = trendPoints[pointIndex];
			const windowStart = addDaysToDateString(point.date, -6);

			while (trendPoints[windowStartIndex] && trendPoints[windowStartIndex].date < windowStart) {
				windowScoreSum -= trendPoints[windowStartIndex].score;
				windowStartIndex += 1;
			}

			windowScoreSum += point.score;
			const windowLength = pointIndex - windowStartIndex + 1;
			const avg = windowScoreSum / windowLength;

			rollingAvgPoints.push({ date: point.date, rollingAvg: Number(avg.toFixed(1)) });
		}

		const distributionMap = new Map<string, { count: number; fill: string }>();
		for (const entry of moodEntries) {
			const resolvedMood = resolveMoodLabel(entry.mood, entry.customMood);
			const existing = distributionMap.get(resolvedMood);
			if (existing) {
				existing.count += 1;
			} else {
				distributionMap.set(resolvedMood, { count: 1, fill: getMoodChartColor(entry.mood) });
			}
		}

		const distribution = Array.from(distributionMap.entries())
			.map(([mood, value]) => ({
				mood,
				count: value.count,
				fill: value.fill,
				percentage:
					moodEntries.length > 0 ? Math.round((value.count / moodEntries.length) * 100) : 0
			}))
			.sort((a, b) => b.count - a.count);

		const weekdayAvg = buildWeekdayAvg(moodEntries);

		const calendarLogs = calendarEntries.map((entry) => ({
			date: entry.date,
			score: getMoodScore(entry.mood),
			resolvedMood: resolveMoodLabel(entry.mood, entry.customMood),
			fill: getMoodChartColor(entry.mood)
		}));

		const moodDates = new Set(moodEntries.map((e) => e.date));
		let currentStreak = 0;
		for (let i = moodRangeDates.length - 1; i >= 0; i -= 1) {
			if (!moodDates.has(moodRangeDates[i])) break;
			currentStreak += 1;
		}

		const totalScore = trendPoints.reduce((sum, p) => sum + p.score, 0);
		const averageScore =
			trendPoints.length > 0 ? Number((totalScore / trendPoints.length).toFixed(1)) : null;

		return {
			activeTab,
			agenda,
			tasks: tasksWithParsedFields,
			allTags,
			moodForm,
			mood: {
				selectedPeriod,
				rangeLabel,
				trendPoints,
				rollingAvgPoints,
				distribution,
				weekdayAvg,
				calendarLogs,
				todayLog: todayLog
					? {
							date: todayLog.date,
							mood: todayLog.mood,
							resolvedMood: resolveMoodLabel(todayLog.mood, todayLog.customMood),
							notes: todayLog.notes
						}
					: null,
				summary: {
					loggedDays: moodEntries.length,
					totalDays: moodRangeDates.length,
					coveragePercentage:
						moodRangeDates.length > 0
							? Math.round((moodEntries.length / moodRangeDates.length) * 100)
							: 0,
					currentStreak,
					mostFrequentMood: distribution[0]?.mood ?? null,
					averageScore
				}
			}
		};
	} catch (error) {
		logger.error('Failed to load tasks', { error, userId });
		return {
			activeTab,
			agenda,
			tasks: [],
			allTags: [],
			moodForm: await buildMoodForm(),
			mood: emptyMood
		};
	}
};

export const actions: Actions = {
	moveBoardTask: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(moveTaskBoardSchema));
		if (!form.valid) return fail(400, { form });

		try {
			const timestamp = new Date().toISOString();
			const moveResult = getDb().transaction((tx) =>
				moveTaskWithinBoard(
					tx,
					user.id,
					form.data.id,
					form.data.toState,
					form.data.toIndex,
					timestamp
				)
			);

			if (!moveResult) {
				return fail(404, { form, error: 'Task not found' });
			}

			return { form };
		} catch (error) {
			logger.error('Failed to move task on board', error, { form, userId: user.id });
			return fail(500, { form, error: 'Failed to move task' });
		}
	}),

	/**
	 * Update task state from the kanban board
	 */
	updateState: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(updateTaskStateSchema));
		if (!form.valid) return fail(400, { form });

		try {
			const existing = await getDb().query.tasks.findFirst({
				where: and(eq(tasks.id, form.data.id), eq(tasks.userId, user.id)),
				columns: {
					id: true,
					state: true
				}
			});

			if (!existing) {
				return fail(404, { form, error: 'Task not found' });
			}

			if (existing.state === form.data.state) {
				return { form };
			}

			const timestamp = new Date().toISOString();
			const moveResult = getDb().transaction((tx) =>
				moveTaskWithinBoard(
					tx,
					user.id,
					form.data.id,
					form.data.state,
					Number.MAX_SAFE_INTEGER,
					timestamp
				)
			);

			if (!moveResult) {
				return fail(404, { form, error: 'Task not found' });
			}

			return { form };
		} catch (error) {
			logger.error('Failed to update task state', error, { form, userId: user.id });
			return fail(500, { form, error: 'Failed to update task state' });
		}
	}),

	delete: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(deleteTaskSchema));
		if (!form.valid) return fail(400, { form });

		try {
			const existing = await getDb().query.tasks.findFirst({
				where: and(eq(tasks.id, form.data.id), eq(tasks.userId, user.id))
			});

			if (!existing) {
				return fail(404, { form, error: 'Task not found' });
			}
			await getDb()
				.delete(tasks)
				.where(and(eq(tasks.id, form.data.id), eq(tasks.userId, user.id)));

			logger.info('Task deleted from board', {
				taskId: form.data.id,
				taskNumber: existing.taskNumber,
				userId: user.id
			});
		} catch (error) {
			logger.error('Failed to delete task from board', { error, form });
			return fail(500, { form, error: 'Failed to delete task' });
		}

		throw redirect(303, '/tasks');
	}),

	createAgendaTemplate: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(createDailyAgendaTemplateSchema));
		if (!form.valid) {
			return failAgendaValidation('create-template', form);
		}

		try {
			await createDailyAgendaTemplate(user.id, form.data.title, form.data.daysOfWeek);

			return buildAgendaActionPayload('create-template', {
				type: 'success',
				text: 'Default item added.'
			});
		} catch (error) {
			return failAgendaMutation('create-template', error, {
				userId: user.id,
				message: 'Failed to add default item.',
				logMessage: 'Failed to create Daily Agenda template'
			});
		}
	}),

	updateAgendaTemplate: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(updateDailyAgendaTemplateSchema));
		if (!form.valid) {
			return failAgendaValidation('update-template', form, { entityId: form.data.id });
		}

		try {
			await updateDailyAgendaTemplate(user.id, form.data.id, form.data.title, form.data.daysOfWeek);

			return buildAgendaActionPayload('update-template', {
				type: 'success',
				text: 'Default item updated.',
				entityId: form.data.id
			});
		} catch (error) {
			return failAgendaMutation('update-template', error, {
				userId: user.id,
				entityId: form.data.id,
				message: 'Failed to update default item.',
				logMessage: 'Failed to update Daily Agenda template'
			});
		}
	}),

	deleteAgendaTemplate: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(deleteDailyAgendaTemplateSchema));
		if (!form.valid) {
			return failAgendaValidation('delete-template', form, { entityId: form.data.id });
		}

		try {
			await deleteDailyAgendaTemplate(user.id, form.data.id);

			return buildAgendaActionPayload('delete-template', {
				type: 'success',
				text: 'Default item deleted.',
				entityId: form.data.id
			});
		} catch (error) {
			return failAgendaMutation('delete-template', error, {
				userId: user.id,
				entityId: form.data.id,
				message: 'Failed to delete default item.',
				logMessage: 'Failed to delete Daily Agenda template'
			});
		}
	}),

	createAgendaEntry: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(createDailyAgendaEntrySchema));
		if (!form.valid) {
			return failAgendaValidation('create-entry', form, { date: form.data.date });
		}

		try {
			await createDailyAgendaCustomEntry(user.id, form.data);

			return buildAgendaActionPayload('create-entry', {
				type: 'success',
				text: 'Agenda item added.',
				date: form.data.date
			});
		} catch (error) {
			return failAgendaMutation('create-entry', error, {
				userId: user.id,
				date: form.data.date,
				message: 'Failed to add agenda item.',
				logMessage: 'Failed to create Daily Agenda entry'
			});
		}
	}),

	updateAgendaEntry: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(updateDailyAgendaEntrySchema));
		if (!form.valid) {
			return failAgendaValidation('update-entry', form, { entityId: form.data.id });
		}

		try {
			await updateDailyAgendaCustomEntry(user.id, form.data.id, form.data.title);

			return buildAgendaActionPayload('update-entry', {
				type: 'success',
				text: 'Agenda item updated.',
				entityId: form.data.id
			});
		} catch (error) {
			return failAgendaMutation('update-entry', error, {
				userId: user.id,
				entityId: form.data.id,
				message: 'Failed to update agenda item.',
				logMessage: 'Failed to update Daily Agenda entry'
			});
		}
	}),

	deleteAgendaEntry: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(deleteDailyAgendaEntrySchema));
		if (!form.valid) {
			return failAgendaValidation('delete-entry', form, { entityId: form.data.id });
		}

		try {
			await deleteDailyAgendaCustomEntry(user.id, form.data.id);

			return buildAgendaActionPayload('delete-entry', {
				type: 'success',
				text: 'Agenda item deleted.',
				entityId: form.data.id
			});
		} catch (error) {
			return failAgendaMutation('delete-entry', error, {
				userId: user.id,
				entityId: form.data.id,
				message: 'Failed to delete agenda item.',
				logMessage: 'Failed to delete Daily Agenda entry'
			});
		}
	}),

	toggleAgendaEntry: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(toggleDailyAgendaEntrySchema));
		if (!form.valid) {
			return failAgendaValidation('toggle-entry', form, { entityId: form.data.id });
		}

		try {
			await toggleDailyAgendaEntry(user.id, form.data.id, form.data.completed);

			return buildAgendaActionPayload('toggle-entry', {
				type: 'success',
				text: form.data.completed ? 'Agenda item marked done.' : 'Agenda item marked incomplete.',
				entityId: form.data.id
			});
		} catch (error) {
			return failAgendaMutation('toggle-entry', error, {
				userId: user.id,
				entityId: form.data.id,
				message: 'Failed to update agenda item.',
				logMessage: 'Failed to toggle Daily Agenda entry'
			});
		}
	}),

	upsertMood: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(moodLogSchema));

		if (!form.valid) {
			logger.warn('Invalid mood log form data', { errors: form.errors, userId: user.id });
			return fail(400, { form });
		}

		const today = getTodayString();
		if (form.data.date > today) {
			return setError(form, 'date', 'You cannot log a mood in the future');
		}

		try {
			const db = getDb();
			const existingMoodLog = await db.query.moodLogs.findFirst({
				where: and(eq(moodLogs.userId, user.id), eq(moodLogs.date, form.data.date))
			});

			const customMood =
				form.data.mood === 'custom' ? normalizeOptionalMoodText(form.data.customMood) : null;
			const notes = normalizeOptionalMoodText(form.data.notes);

			if (existingMoodLog) {
				await db
					.update(moodLogs)
					.set({
						mood: form.data.mood,
						customMood,
						notes,
						...withAuditFieldsForUpdate()
					})
					.where(and(eq(moodLogs.id, existingMoodLog.id), eq(moodLogs.userId, user.id)));

				logger.info('Mood log updated', { moodLogId: existingMoodLog.id, userId: user.id });
				return message(form, { type: 'success', text: "Today's mood was updated." });
			}

			const moodLogId = generateId();
			await db.insert(moodLogs).values({
				id: moodLogId,
				userId: user.id,
				date: form.data.date,
				mood: form.data.mood,
				customMood,
				notes,
				...withAuditFieldsForCreate()
			});

			logger.info('Mood log created', { moodLogId, userId: user.id });
			return message(form, { type: 'success', text: "Today's mood was logged." });
		} catch (error) {
			logger.error('Failed to upsert mood log', { error, userId: user.id });
			return message(
				form,
				{ type: 'error', text: 'Failed to save your mood. Please try again.' },
				{ status: 500 }
			);
		}
	})
};
