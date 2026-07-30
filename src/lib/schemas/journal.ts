import { z } from 'zod';

/**
 * Schema for creating and updating journal entries
 */
export const journalEntrySchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)'),
	content: z.string().min(1, 'Content is required'),
	location: z.string().optional(),
	weatherTemp: z.coerce.number().optional(),
	weatherCondition: z.string().optional()
});

export type JournalEntryFormValues = z.infer<typeof journalEntrySchema>;

/**
 * Serializes weather form fields into the JSON string stored on a journal entry.
 */
export function buildWeatherJson(
	temp: number | undefined,
	condition: string | undefined
): string | null {
	return temp || condition ? JSON.stringify({ temp, condition }) : null;
}

/**
 * Schema for filtering journal entries
 */
export const journalFilterSchema = z.object({
	content: z.string().optional(),
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	limit: z.coerce.number().min(1).max(100).optional().default(50)
});
