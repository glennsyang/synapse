import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)');

export const apiCreateJournalSchema = z.object({
	date: dateString,
	content: z.string().min(1, 'Content is required'),
	location: z.string().optional(),
	weatherTemp: z.number().optional(),
	weatherCondition: z.string().optional()
});

export const apiUpdateJournalSchema = z.object({
	date: dateString.optional(),
	content: z.string().min(1, 'Content is required').optional(),
	location: z.string().nullable().optional(),
	weatherTemp: z.number().nullable().optional(),
	weatherCondition: z.string().nullable().optional()
});

export const apiJournalListQuerySchema = z.object({
	startDate: dateString.optional(),
	endDate: dateString.optional(),
	content: z.string().optional(),
	limit: z.coerce.number().int().min(1).max(200).default(50)
});

export type ApiCreateJournalInput = z.infer<typeof apiCreateJournalSchema>;
export type ApiUpdateJournalInput = z.infer<typeof apiUpdateJournalSchema>;
