import { z } from 'zod';

import { isMoodValue, moodPeriods } from '$lib/utils/mood';

const localDateString = z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, 'Invalid date format');

export const moodLogSchema = z
	.object({
		date: localDateString,
		mood: z.string().min(1, 'Choose a mood'),
		customMood: z.string().trim().max(40, 'Custom mood must be 40 characters or fewer').default(''),
		notes: z.string().trim().max(280, 'Notes must be 280 characters or fewer').default('')
	})
	.superRefine((data, ctx) => {
		if (!isMoodValue(data.mood)) {
			ctx.addIssue({
				code: 'custom',
				message: 'Choose a valid mood',
				path: ['mood']
			});
		}

		if (data.mood === 'custom' && data.customMood.trim().length === 0) {
			ctx.addIssue({
				code: 'custom',
				message: 'Add a custom mood label',
				path: ['customMood']
			});
		}
	});

export const moodPeriodSchema = z.enum(moodPeriods);
export const journalPageTabSchema = z.enum(['journal', 'mood']);

export type MoodLogFormValues = z.infer<typeof moodLogSchema>;
