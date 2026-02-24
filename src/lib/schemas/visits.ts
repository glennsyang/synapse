import { z } from 'zod';

const booleanFromForm = z.preprocess((value) => {
	if (value === true || value === 'true' || value === 'on' || value === 1 || value === '1') {
		return true;
	}

	if (
		value === false ||
		value === 'false' ||
		value === 0 ||
		value === '0' ||
		value === undefined ||
		value === null ||
		value === ''
	) {
		return false;
	}

	return value;
}, z.boolean());

/**
 * Schema for creating and updating people
 */
export const personSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
	isExempt: booleanFromForm.default(false)
});

export type PersonFormData = z.infer<typeof personSchema>;

/**
 * Schema for creating and updating visits
 */
export const visitSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)'),
	time: z
		.string()
		.regex(/^\d{2}:\d{2}$/, 'Invalid time format (use HH:MM)')
		.optional(),
	companions: z.string().optional(),
	notes: z.string().optional(),
	followUpDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)')
		.optional()
});

export type VisitFormData = z.infer<typeof visitSchema>;

/**
 * Schema for filtering visits
 */
export const visitFilterSchema = z.object({
	status: z.enum(['green', 'yellow', 'red', 'none', 'exempt']).optional()
});

export type VisitFilterData = z.infer<typeof visitFilterSchema>;
