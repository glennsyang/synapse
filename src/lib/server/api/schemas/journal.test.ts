import { describe, expect, it } from 'vitest';

import {
	apiCreateJournalSchema,
	apiJournalListQuerySchema,
	apiUpdateJournalSchema
} from './journal';

describe('apiCreateJournalSchema', () => {
	it('accepts a valid journal entry', () => {
		const result = apiCreateJournalSchema.safeParse({
			date: '2026-08-25',
			content: 'Went for a long walk.'
		});
		expect(result.success).toBe(true);
	});

	it('rejects empty content', () => {
		expect(apiCreateJournalSchema.safeParse({ date: '2026-08-25', content: '' }).success).toBe(
			false
		);
	});

	it('rejects an invalid date format', () => {
		expect(apiCreateJournalSchema.safeParse({ date: '08/25/2026', content: 'Hello' }).success).toBe(
			false
		);
	});
});

describe('apiUpdateJournalSchema', () => {
	it('accepts an empty partial update', () => {
		expect(apiUpdateJournalSchema.safeParse({}).success).toBe(true);
	});

	it('accepts explicit nulls to clear optional fields', () => {
		const result = apiUpdateJournalSchema.safeParse({
			location: null,
			weatherTemp: null,
			weatherCondition: null
		});
		expect(result.success).toBe(true);
	});
});

describe('apiJournalListQuerySchema', () => {
	it('defaults limit to 50', () => {
		expect(apiJournalListQuerySchema.safeParse({}).data?.limit).toBe(50);
	});
});
