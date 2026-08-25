import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)');

const MealTypeEnum = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);

export const apiCreateMealSchema = z.object({
	date: dateString,
	timeOfDay: MealTypeEnum,
	description: z.string().min(1, 'Description is required'),
	caloriesEstimate: z.number().int().positive().optional()
});

export const apiUpdateMealSchema = z.object({
	date: dateString.optional(),
	timeOfDay: MealTypeEnum.optional(),
	description: z.string().min(1, 'Description is required').optional(),
	caloriesEstimate: z.number().int().positive().nullable().optional()
});

export const apiMealListQuerySchema = z.object({
	startDate: dateString.optional(),
	endDate: dateString.optional(),
	timeOfDay: MealTypeEnum.optional(),
	limit: z.coerce.number().int().min(1).max(200).default(50)
});

export type ApiCreateMealInput = z.infer<typeof apiCreateMealSchema>;
export type ApiUpdateMealInput = z.infer<typeof apiUpdateMealSchema>;
