import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)');
const timeString = z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (use HH:MM)');

const WorkoutTypeEnum = z.enum(['strength', 'cardio', 'hiit', 'walk', 'stretch', 'other']);

const apiWorkoutExerciseSchema = z.object({
	exerciseName: z.string().min(1, 'Exercise name is required'),
	sets: z.number().int().positive().nullable().optional(),
	reps: z.number().int().positive().nullable().optional(),
	weightLbs: z.number().int().positive().nullable().optional()
});

export const apiCreateWorkoutSchema = z.object({
	date: dateString,
	time: timeString.optional(),
	type: WorkoutTypeEnum,
	durationMinutes: z.number().int().positive().optional(),
	steps: z.number().int().positive().optional(),
	notes: z.string().optional(),
	exercises: z.array(apiWorkoutExerciseSchema).optional()
});

export const apiUpdateWorkoutSchema = z.object({
	date: dateString.optional(),
	time: timeString.nullable().optional(),
	type: WorkoutTypeEnum.optional(),
	durationMinutes: z.number().int().positive().nullable().optional(),
	steps: z.number().int().positive().nullable().optional(),
	notes: z.string().nullable().optional(),
	exercises: z.array(apiWorkoutExerciseSchema).optional()
});

export const apiWorkoutListQuerySchema = z.object({
	startDate: dateString.optional(),
	endDate: dateString.optional(),
	type: WorkoutTypeEnum.optional(),
	limit: z.coerce.number().int().min(1).max(200).default(50)
});

export type ApiCreateWorkoutInput = z.infer<typeof apiCreateWorkoutSchema>;
export type ApiUpdateWorkoutInput = z.infer<typeof apiUpdateWorkoutSchema>;
