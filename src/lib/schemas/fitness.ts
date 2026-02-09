import { z } from 'zod';

/**
 * Schema for logging a weight entry
 */
export const logWeightSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)'),
	time: z
		.string()
		.regex(/^\d{2}:\d{2}$/, 'Invalid time format (use HH:MM)')
		.optional()
		.nullable(),
	weightLbs: z.coerce.number().positive('Weight must be positive')
});

export type LogWeightFormData = z.infer<typeof logWeightSchema>;

/**
 * Schema for setting goal weight
 */
export const setGoalWeightSchema = z.object({
	targetWeightLbs: z.coerce.number().positive('Target weight must be positive')
});

export type SetGoalWeightFormData = z.infer<typeof setGoalWeightSchema>;

/**
 * Schema for workout exercise (for strength workouts)
 */
export const workoutExerciseSchema = z.object({
	exerciseName: z.string().min(1, 'Exercise name is required'),
	sets: z.coerce.number().int().positive().optional().nullable(),
	reps: z.coerce.number().int().positive().optional().nullable(),
	weightLbs: z.coerce.number().int().positive().optional().nullable()
});

export type WorkoutExerciseData = z.infer<typeof workoutExerciseSchema>;

/**
 * Schema for logging a workout
 */
export const logWorkoutSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)'),
	time: z
		.string()
		.regex(/^\d{2}:\d{2}$/, 'Invalid time format (use HH:MM)')
		.optional()
		.nullable(),
	type: z.enum(['strength', 'cardio', 'yoga', 'other']),
	durationMinutes: z.coerce.number().int().positive().optional().nullable(),
	notes: z.string().optional().nullable(),
	exercises: z.string().optional().nullable() // JSON string for strength workouts
});

export type LogWorkoutFormData = z.infer<typeof logWorkoutSchema>;

/**
 * Schema for updating a workout
 */
export const updateWorkoutSchema = logWorkoutSchema.extend({
	id: z.uuid()
});

export type UpdateWorkoutFormData = z.infer<typeof updateWorkoutSchema>;

/**
 * Schema for logging a meal
 */
export const logMealSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)'),
	timeOfDay: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
	description: z.string().min(1, 'Description is required'),
	caloriesEstimate: z.coerce.number().int().positive().optional().nullable()
});

export type LogMealFormData = z.infer<typeof logMealSchema>;

/**
 * Schema for updating a meal
 */
export const updateMealSchema = logMealSchema.extend({
	id: z.uuid()
});

export type UpdateMealFormData = z.infer<typeof updateMealSchema>;

/**
 * Schema for setting daily calorie target
 */
export const setCalorieTargetSchema = z.object({
	targetCalories: z.coerce.number().int().positive('Target calories must be positive')
});

export type SetCalorieTargetFormData = z.infer<typeof setCalorieTargetSchema>;

/**
 * Schema for creating/updating workout reminder
 */
export const workoutReminderSchema = z.object({
	workoutType: z.enum(['strength', 'cardio', 'yoga', 'other']),
	cadence: z.enum(['daily', 'weekly']),
	daysOfWeek: z.string().optional().nullable(), // JSON array of day numbers (0-6)
	time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (use HH:MM)'),
	enabled: z.boolean().default(true)
});

export type WorkoutReminderFormData = z.infer<typeof workoutReminderSchema>;

/**
 * Schema for updating workout reminder
 */
export const updateWorkoutReminderSchema = workoutReminderSchema.extend({
	id: z.uuid()
});

export type UpdateWorkoutReminderFormData = z.infer<typeof updateWorkoutReminderSchema>;

/**
 * Schema for filtering workout list
 */
export const workoutFilterSchema = z.object({
	type: z.enum(['strength', 'cardio', 'yoga', 'other']).optional(),
	startDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	endDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional()
});

export type WorkoutFilterData = z.infer<typeof workoutFilterSchema>;

/**
 * Schema for filtering meal list
 */
export const mealFilterSchema = z.object({
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	timeOfDay: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional()
});

export type MealFilterData = z.infer<typeof mealFilterSchema>;
