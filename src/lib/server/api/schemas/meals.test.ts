import { describe, expect, it } from 'vitest';

import { apiCreateMealSchema, apiMealListQuerySchema, apiUpdateMealSchema } from './meals';

describe('apiCreateMealSchema', () => {
	it('accepts a valid meal', () => {
		const result = apiCreateMealSchema.safeParse({
			date: '2026-08-25',
			timeOfDay: 'lunch',
			description: 'Chicken salad'
		});
		expect(result.success).toBe(true);
	});

	it('rejects an empty description', () => {
		expect(
			apiCreateMealSchema.safeParse({ date: '2026-08-25', timeOfDay: 'lunch', description: '' })
				.success
		).toBe(false);
	});

	it('rejects an invalid timeOfDay', () => {
		expect(
			apiCreateMealSchema.safeParse({
				date: '2026-08-25',
				timeOfDay: 'brunch',
				description: 'Eggs'
			}).success
		).toBe(false);
	});
});

describe('apiUpdateMealSchema', () => {
	it('accepts an empty partial update', () => {
		expect(apiUpdateMealSchema.safeParse({}).success).toBe(true);
	});
});

describe('apiMealListQuerySchema', () => {
	it('defaults limit to 50', () => {
		expect(apiMealListQuerySchema.safeParse({}).data?.limit).toBe(50);
	});
});
