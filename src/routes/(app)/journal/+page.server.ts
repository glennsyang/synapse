import { fail } from '@sveltejs/kit';
import { and, asc, desc, eq, gte, like, lte } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { journalFilterSchema } from '$lib/schemas/journal';
import { journalPageTabSchema, moodLogSchema, moodPeriodSchema } from '$lib/schemas/mood';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { getDb } from '$lib/server/db';
import { journalEntries, moodLogs } from '$lib/server/db/schema';
import { generateId } from '$lib/server/db/utils';
import {
	formatDateShort,
	getDateRange,
	getStartOfMonth,
	getStartOfQuarter,
	getStartOfWeek,
	getTodayString
} from '$lib/utils/date';
import { logger } from '$lib/utils/logger';
import {
	getMoodChartColor,
	getMoodScore,
	getMoodScoreLabel,
	normalizeOptionalMoodText,
	resolveMoodLabel
} from '$lib/utils/mood';

import type { Actions, PageServerLoad } from './$types';

function getSelectedTab(value: string | null) {
	const parsedTab = journalPageTabSchema.safeParse(value ?? 'journal');
	return parsedTab.success ? parsedTab.data : 'journal';
}

function getSelectedPeriod(value: string | null) {
	const parsedPeriod = moodPeriodSchema.safeParse(value ?? 'week');
	return parsedPeriod.success ? parsedPeriod.data : 'week';
}

function getMoodRangeStart(today: string, period: 'week' | 'month' | 'quarter'): string {
	if (period === 'month') {
		return getStartOfMonth(today);
	}

	if (period === 'quarter') {
		return getStartOfQuarter(today);
	}

	return getStartOfWeek(today);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const today = getTodayString();
	const selectedTab = getSelectedTab(url.searchParams.get('tab'));
	const selectedPeriod = getSelectedPeriod(url.searchParams.get('period'));
	const moodRangeStart = getMoodRangeStart(today, selectedPeriod);
	const moodRangeDates = getDateRange(moodRangeStart, today);

	const filters = journalFilterSchema.safeParse({
		tag: url.searchParams.get('tag') ?? undefined,
		startDate: url.searchParams.get('startDate') ?? undefined,
		endDate: url.searchParams.get('endDate') ?? undefined,
		limit: url.searchParams.get('limit') ?? undefined
	});

	const buildMoodForm = async (todayMoodLog?: typeof moodLogs.$inferSelect | null) => {
		return superValidate(
			{
				date: todayMoodLog?.date ?? today,
				mood: todayMoodLog?.mood ?? '',
				customMood: todayMoodLog?.customMood ?? '',
				notes: todayMoodLog?.notes ?? ''
			},
			zod4(moodLogSchema)
		);
	};

	if (!filters.success) {
		logger.error('Invalid filter parameters', { error: filters.error });
		return {
			entries: [],
			filters: {
				tag: '',
				startDate: '',
				endDate: ''
			},
			selectedTab,
			moodForm: await buildMoodForm(),
			mood: {
				selectedPeriod,
				rangeLabel: `${formatDateShort(moodRangeStart)} - ${formatDateShort(today)}`,
				trendPoints: [],
				distribution: [],
				todayLog: null,
				summary: {
					loggedDays: 0,
					totalDays: moodRangeDates.length,
					coveragePercentage: 0,
					currentStreak: 0,
					mostFrequentMood: null,
					averageScore: null,
					scaleHint: getMoodScoreLabel(4)
				}
			}
		};
	}

	const { tag, startDate, endDate, limit } = filters.data;

	try {
		const db = getDb();
		const conditions = [eq(journalEntries.userId, locals.user?.id)];

		if (startDate) {
			conditions.push(gte(journalEntries.date, startDate));
		}
		if (endDate) {
			conditions.push(lte(journalEntries.date, endDate));
		}
		if (tag) {
			conditions.push(like(journalEntries.tags, `"%${tag}%"`));
		}

		const [entries, moodEntries] = await Promise.all([
			db.query.journalEntries.findMany({
				where: and(...conditions),
				orderBy: [desc(journalEntries.date)],
				limit
			}),
			db.query.moodLogs.findMany({
				where: and(
					eq(moodLogs.userId, locals.user?.id),
					gte(moodLogs.date, moodRangeStart),
					lte(moodLogs.date, today)
				),
				orderBy: [asc(moodLogs.date)]
			})
		]);

		const parsedEntries = entries.map((entry: typeof journalEntries.$inferSelect) => ({
			...entry,
			tags: entry.tags ? JSON.parse(entry.tags) : null,
			weather: entry.weather ? JSON.parse(entry.weather) : null
		}));

		const todayLog = moodEntries.find((entry) => entry.date === today) ?? null;
		const moodTrendPoints = moodEntries.map((entry) => ({
			date: entry.date,
			score: getMoodScore(entry.mood),
			resolvedMood: resolveMoodLabel(entry.mood, entry.customMood),
			mood: entry.mood,
			isCustom: entry.mood === 'custom',
			fill: getMoodChartColor(entry.mood)
		}));

		const distributionMap = new Map<string, { count: number; fill: string }>();
		for (const entry of moodEntries) {
			const resolvedMood = resolveMoodLabel(entry.mood, entry.customMood);
			const existingEntry = distributionMap.get(resolvedMood);

			if (existingEntry) {
				existingEntry.count += 1;
				continue;
			}

			distributionMap.set(resolvedMood, {
				count: 1,
				fill: getMoodChartColor(entry.mood)
			});
		}

		const distribution = Array.from(distributionMap.entries())
			.map(([mood, value]) => ({
				mood,
				count: value.count,
				fill: value.fill,
				percentage:
					moodEntries.length > 0 ? Math.round((value.count / moodEntries.length) * 100) : 0
			}))
			.sort((left, right) => right.count - left.count);

		const moodDates = new Set(moodEntries.map((entry) => entry.date));
		let currentStreak = 0;
		for (let index = moodRangeDates.length - 1; index >= 0; index -= 1) {
			if (!moodDates.has(moodRangeDates[index])) {
				break;
			}

			currentStreak += 1;
		}

		const totalScore = moodTrendPoints.reduce((sum, point) => sum + point.score, 0);
		const averageScore =
			moodTrendPoints.length > 0 ? Number((totalScore / moodTrendPoints.length).toFixed(1)) : null;

		return {
			entries: parsedEntries,
			filters: {
				tag: tag ?? '',
				startDate: startDate ?? '',
				endDate: endDate ?? ''
			},
			selectedTab,
			moodForm: await buildMoodForm(todayLog),
			mood: {
				selectedPeriod,
				rangeLabel: `${formatDateShort(moodRangeStart)} - ${formatDateShort(today)}`,
				trendPoints: moodTrendPoints,
				distribution,
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
					averageScore,
					scaleHint: getMoodScoreLabel(4)
				}
			}
		};
	} catch (error) {
		logger.error('Failed to load journal entries', { error });
		return {
			entries: [],
			filters: {
				tag: tag ?? '',
				startDate: startDate ?? '',
				endDate: endDate ?? ''
			},
			selectedTab,
			moodForm: await buildMoodForm(),
			mood: {
				selectedPeriod,
				rangeLabel: `${formatDateShort(moodRangeStart)} - ${formatDateShort(today)}`,
				trendPoints: [],
				distribution: [],
				todayLog: null,
				summary: {
					loggedDays: 0,
					totalDays: moodRangeDates.length,
					coveragePercentage: 0,
					currentStreak: 0,
					mostFrequentMood: null,
					averageScore: null,
					scaleHint: getMoodScoreLabel(4)
				}
			}
		};
	}
};

export const actions: Actions = {
	upsertMood: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(moodLogSchema));

		if (!form.valid) {
			logger.warn('Invalid mood log form data', { errors: form.errors, userId: user.id });
			return fail(400, { form });
		}

		const today = getTodayString();
		if (form.data.date > today) {
			form.errors.date = ['You cannot log a mood in the future'];
			return fail(400, { form });
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
						updatedAt: new Date().toISOString()
					})
					.where(and(eq(moodLogs.id, existingMoodLog.id), eq(moodLogs.userId, user.id)));

				logger.info('Mood log updated', { moodLogId: existingMoodLog.id, userId: user.id });
				return message(form, {
					type: 'success',
					text: "Today's mood was updated."
				});
			}

			const moodLogId = generateId();
			await db.insert(moodLogs).values({
				id: moodLogId,
				userId: user.id,
				date: form.data.date,
				mood: form.data.mood,
				customMood,
				notes,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});

			logger.info('Mood log created', { moodLogId, userId: user.id });
			return message(form, {
				type: 'success',
				text: "Today's mood was logged."
			});
		} catch (error) {
			logger.error('Failed to upsert mood log', { error, userId: user.id });
			return message(
				form,
				{
					type: 'error',
					text: 'Failed to save your mood. Please try again.'
				},
				{ status: 500 }
			);
		}
	})
};
