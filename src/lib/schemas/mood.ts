import { isMoodValue, moodPeriods } from '$lib/utils/mood';
import { z } from 'zod';

const localDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format');

export const moodLogSchema = z
	.object({
		date: localDateString,
		mood: z.string().min(1, 'Choose a mood'),
		customMood: z.string().trim().max(40, 'Custom mood must be 40 characters or fewer').default(''),
		notes: z.string().trim().max(280, 'Notes must be 280 characters or fewer').default('')
	})
	.superRefine((data, ctx) => {
		if (data.mood.length > 0 && !isMoodValue(data.mood)) {
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

export type MoodLogFormValues = z.infer<typeof moodLogSchema>;
