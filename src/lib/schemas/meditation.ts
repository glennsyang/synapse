import { z } from 'zod';

/**
 * Allowed mood tags for meditation routines
 */
export const MOOD_TAGS = ['Anxious', 'Low Energy', 'Focused', 'Pre-Sleep', 'General'] as const;

export type MoodTag = (typeof MOOD_TAGS)[number];

/**
 * Schema for creating a meditation routine
 */
export const createRoutineSchema = z.object({
	title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
	description: z.string().optional(),
	link_url: z.url('Invalid URL format'),
	duration_minutes: z.coerce.number().int().positive('Duration must be positive'),
	mood_tags: z.string().min(1, 'At least one mood tag is required')
});

/**
 * Schema for updating a meditation routine
 */
export const updateRoutineSchema = z.object({
	title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
	description: z.string().optional(),
	link_url: z.url('Invalid URL format'),
	duration_minutes: z.coerce.number().int().positive('Duration must be positive'),
	mood_tags: z.string().min(1, 'At least one mood tag is required')
});

/**
 * Schema for creating or updating a meditation schedule
 */
export const scheduleSchema = z.object({
	cadence: z.enum(['daily', 'weekly', 'custom']),
	days_of_week: z.string().optional(),
	time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format')
});

/**
 * Schema for completing a meditation session
 */
export const completeSessionSchema = z.object({
	completed_at: z.string().min(1, 'Date and time is required'),
	pre_mood_rating: z.coerce.number().int().min(1).max(5).optional(),
	mood_rating: z.coerce.number().int().min(1).max(5).optional(),
	notes: z.string().optional()
});

/**
 * Schema for editing an existing meditation session
 */
export const editSessionSchema = z.object({
	id: z.string().min(1),
	completed_at: z.string().min(1, 'Date and time is required'),
	pre_mood_rating: z.coerce.number().int().min(1).max(5).optional(),
	mood_rating: z.coerce.number().int().min(1).max(5).optional(),
	notes: z.string().optional()
});

/**
 * Schema for filtering meditation routines
 */
export const routineFilterSchema = z.object({
	moods: z.array(z.enum([...MOOD_TAGS])).optional(),
	duration: z.coerce.number().int().optional(),
	search: z.string().max(200).optional()
});
