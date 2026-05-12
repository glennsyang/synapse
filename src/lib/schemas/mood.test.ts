import { describe, expect, it } from 'vitest';

import { moodLogSchema, moodPeriodSchema } from './mood';

describe('moodLogSchema', () => {
	const validLog = {
		date: '2026-03-15',
		mood: 'happy',
		customMood: '',
		notes: ''
	};

	it('accepts a valid mood log entry', () => {
		expect(() => moodLogSchema.parse(validLog)).not.toThrow();
	});

	it('applies default empty strings for customMood and notes', () => {
		const result = moodLogSchema.parse({ date: '2026-03-15', mood: 'calm' });
		expect(result.customMood).toBe('');
		expect(result.notes).toBe('');
	});

	it('rejects an invalid mood value', () => {
		const result = moodLogSchema.safeParse({ ...validLog, mood: 'ecstatic' });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe('Choose a valid mood');
		}
	});

	it('rejects a custom mood without a custom label', () => {
		const result = moodLogSchema.safeParse({ ...validLog, mood: 'custom', customMood: '' });
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((e) => e.path.join('.'));
			expect(paths).toContain('customMood');
		}
	});

	it('accepts a custom mood with a valid label', () => {
		const result = moodLogSchema.parse({ ...validLog, mood: 'custom', customMood: 'Grateful' });
		expect(result.customMood).toBe('Grateful');
	});

	it('trims whitespace from customMood and notes', () => {
		const result = moodLogSchema.parse({
			...validLog,
			mood: 'custom',
			customMood: '  Grateful  ',
			notes: '  Felt good  '
		});
		expect(result.customMood).toBe('Grateful');
		expect(result.notes).toBe('Felt good');
	});

	it('rejects a customMood label exceeding 40 characters', () => {
		const result = moodLogSchema.safeParse({
			...validLog,
			mood: 'custom',
			customMood: 'A'.repeat(41)
		});
		expect(result.success).toBe(false);
	});

	it('rejects notes exceeding 280 characters', () => {
		const result = moodLogSchema.safeParse({ ...validLog, notes: 'x'.repeat(281) });
		expect(result.success).toBe(false);
	});

	it('rejects an invalid date format', () => {
		expect(moodLogSchema.safeParse({ ...validLog, date: '03/15/2026' }).success).toBe(false);
	});
});

describe('moodPeriodSchema', () => {
	it('accepts valid mood periods', () => {
		expect(() => moodPeriodSchema.parse('week')).not.toThrow();
		expect(() => moodPeriodSchema.parse('month')).not.toThrow();
		expect(() => moodPeriodSchema.parse('quarter')).not.toThrow();
	});

	it('rejects invalid period values', () => {
		expect(moodPeriodSchema.safeParse('year').success).toBe(false);
		expect(moodPeriodSchema.safeParse('').success).toBe(false);
	});
});
