import { z } from 'zod';

import { getStartOfWeek, getTodayString } from '$lib/utils/date';

const LOCAL_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const localDateStringSchema = z
	.string()
	.regex(LOCAL_DATE_REGEX, 'Invalid date format (use YYYY-MM-DD)');

const titleSchema = z.string().trim().min(1, 'Title is required').max(200, 'Title too long');

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

const TaskPageTabEnum = z.enum(['kanban', 'agenda']);

const dailyAgendaWeekSchema = localDateStringSchema.optional().transform((value) => {
	return getStartOfWeek(value ?? getTodayString());
});

export const dailyAgendaPageQuerySchema = z.object({
	tab: TaskPageTabEnum.optional().default('kanban'),
	week: dailyAgendaWeekSchema
});

export const createDailyAgendaTemplateSchema = z.object({
	title: titleSchema
});

export const updateDailyAgendaTemplateSchema = z.object({
	id: z.uuid(),
	title: titleSchema
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
