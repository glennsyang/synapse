import { describe, expect, it } from 'vitest';

import { apiCreateVisitSchema, apiUpdateVisitSchema, apiVisitListQuerySchema } from './visits';

describe('apiCreateVisitSchema', () => {
	it('accepts a minimal valid visit', () => {
		const result = apiCreateVisitSchema.safeParse({ personId: 'person-1', date: '2026-08-25' });
		expect(result.success).toBe(true);
	});

	it('requires a personId', () => {
		expect(apiCreateVisitSchema.safeParse({ date: '2026-08-25' }).success).toBe(false);
	});

	it('accepts companions as an array of strings', () => {
		const result = apiCreateVisitSchema.safeParse({
			personId: 'person-1',
			date: '2026-08-25',
			companions: ['Alex', 'Sam']
		});
		expect(result.success).toBe(true);
	});
});

describe('apiUpdateVisitSchema', () => {
	it('accepts an empty partial update (no personId field at all)', () => {
		expect(apiUpdateVisitSchema.safeParse({}).success).toBe(true);
	});

	it('accepts nulling out optional fields', () => {
		expect(
			apiUpdateVisitSchema.safeParse({ time: null, companions: null, notes: null }).success
		).toBe(true);
	});
});

describe('apiVisitListQuerySchema', () => {
	it('defaults limit to 50', () => {
		expect(apiVisitListQuerySchema.safeParse({}).data?.limit).toBe(50);
	});

	it('accepts an optional personId filter', () => {
		const result = apiVisitListQuerySchema.safeParse({ personId: 'person-1' });
		expect(result.data?.personId).toBe('person-1');
	});
});
