import { z } from 'zod';

import { getStartOfWeek, getTodayString } from '$lib/utils/date';

const LOCAL_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const localDateStringSchema = z
	.string()
	.regex(LOCAL_DATE_REGEX, 'Invalid date format (use YYYY-MM-DD)');

const titleSchema = z.string().trim().min(1, 'Title is required').max(200, 'Title too long');

const daysOfWeekSchema = z.string().transform((value, ctx) => {
	const selectedDays = [] as number[];
	const seen = new Set<number>();
	const tokens = value
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0);

	if (tokens.length === 0) {
		ctx.addIssue({
			code: 'custom',
			message: 'Select at least one day.'
		});
		return z.NEVER;
	}

	for (const token of tokens) {
		const parsedDay = Number.parseInt(token, 10);
		if (Number.isNaN(parsedDay) || parsedDay < 0 || parsedDay > 6) {
			ctx.addIssue({
				code: 'custom',
				message: 'Days must be between 0 (Sunday) and 6 (Saturday).'
			});
			return z.NEVER;
		}

		if (!seen.has(parsedDay)) {
			seen.add(parsedDay);
			selectedDays.push(parsedDay);
		}
	}

	return selectedDays.sort((left, right) => left - right);
});

const booleanishSchema = z
	.union([z.boolean(), z.string().trim().toLowerCase()])
	.transform((value, ctx) => {
		if (typeof value === 'boolean') {
			return value;
		}

		if (value === 'true' || value === '1' || value === 'on') {
			return true;
		}

		if (value === 'false' || value === '0' || value === '') {
			return false;
		}

		ctx.addIssue({
			code: 'custom',
			message: 'Completed must be true or false'
		});

		return z.NEVER;
	});

const TaskPageTabEnum = z.enum(['kanban', 'agenda', 'mood']);

const dailyAgendaWeekSchema = localDateStringSchema.optional().transform((value) => {
	return getStartOfWeek(value ?? getTodayString());
});

export const dailyAgendaPageQuerySchema = z.object({
	tab: TaskPageTabEnum.optional().default('kanban'),
	week: dailyAgendaWeekSchema
});

export const createDailyAgendaTemplateSchema = z.object({
	title: titleSchema,
	daysOfWeek: daysOfWeekSchema
});

export const updateDailyAgendaTemplateSchema = z.object({
	id: z.uuid(),
	title: titleSchema,
	daysOfWeek: daysOfWeekSchema
});

export const deleteDailyAgendaTemplateSchema = z.object({
	id: z.uuid()
});

export const createDailyAgendaEntrySchema = z.object({
	date: localDateStringSchema,
	title: titleSchema
});

export const updateDailyAgendaEntrySchema = z.object({
	id: z.uuid(),
	title: titleSchema
});

export const deleteDailyAgendaEntrySchema = z.object({
	id: z.uuid()
});

export const toggleDailyAgendaEntrySchema = z.object({
	id: z.uuid(),
	completed: booleanishSchema
});
