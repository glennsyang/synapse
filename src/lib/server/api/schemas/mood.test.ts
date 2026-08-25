import { describe, expect, it } from 'vitest';

import { apiMoodListQuerySchema, apiUpsertMoodSchema } from './mood';

describe('apiUpsertMoodSchema', () => {
	it('accepts a valid mood log', () => {
		const result = apiUpsertMoodSchema.safeParse({ date: '2026-08-25', mood: 'happy' });
		expect(result.success).toBe(true);
	});

	it('rejects an unrecognized mood value', () => {
		expect(apiUpsertMoodSchema.safeParse({ date: '2026-08-25', mood: 'ecstatic' }).success).toBe(
			false
		);
	});

	it('rejects mood "custom" without a customMood label', () => {
		expect(apiUpsertMoodSchema.safeParse({ date: '2026-08-25', mood: 'custom' }).success).toBe(
			false
		);
	});

	it('accepts mood "custom" with a customMood label', () => {
		const result = apiUpsertMoodSchema.safeParse({
			date: '2026-08-25',
			mood: 'custom',
			customMood: 'Nostalgic'
		});
		expect(result.success).toBe(true);
	});

	it('rejects a malformed date', () => {
		expect(apiUpsertMoodSchema.safeParse({ date: '08-25-2026', mood: 'happy' }).success).toBe(
			false
		);
	});
});

describe('apiMoodListQuerySchema', () => {
	it('accepts no date range', () => {
		expect(apiMoodListQuerySchema.safeParse({}).success).toBe(true);
	});

	it('accepts a matched startDate/endDate pair', () => {
		expect(
			apiMoodListQuerySchema.safeParse({ startDate: '2026-08-01', endDate: '2026-08-31' }).success
		).toBe(true);
	});

	it('rejects a startDate without an endDate', () => {
		expect(apiMoodListQuerySchema.safeParse({ startDate: '2026-08-01' }).success).toBe(false);
	});
});
