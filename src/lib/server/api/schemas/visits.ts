import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)');
const timeString = z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (use HH:MM)');

export const apiCreateVisitSchema = z.object({
	personId: z.string().min(1, 'personId is required'),
	date: dateString,
	time: timeString.optional(),
	companions: z.array(z.string().min(1)).optional(),
	notes: z.string().optional(),
	followUpDate: dateString.optional()
});

export const apiUpdateVisitSchema = z.object({
	date: dateString.optional(),
	time: timeString.nullable().optional(),
	companions: z.array(z.string().min(1)).nullable().optional(),
	notes: z.string().nullable().optional(),
	followUpDate: dateString.nullable().optional()
});

export const apiVisitListQuerySchema = z.object({
	personId: z.string().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(200).default(50)
});

export type ApiCreateVisitInput = z.infer<typeof apiCreateVisitSchema>;
export type ApiUpdateVisitInput = z.infer<typeof apiUpdateVisitSchema>;
