import { describe, expect, it } from 'vitest';

import { apiCreateTaskSchema, apiTaskListQuerySchema, apiUpdateTaskSchema } from './tasks';

describe('apiCreateTaskSchema', () => {
	it('accepts a minimal valid task', () => {
		const result = apiCreateTaskSchema.safeParse({ title: 'Renew passport', priority: 2 });
		expect(result.success).toBe(true);
		expect(result.data?.state).toBe('new');
	});

	it('rejects an empty title', () => {
		expect(apiCreateTaskSchema.safeParse({ title: '', priority: 1 }).success).toBe(false);
	});

	it('requires priority to be given', () => {
		expect(apiCreateTaskSchema.safeParse({ title: 'x' }).success).toBe(false);
	});

	it('rejects a priority outside 1-4', () => {
		expect(apiCreateTaskSchema.safeParse({ title: 'x', priority: 5 }).success).toBe(false);
	});

	it('rejects a malformed dueDate', () => {
		expect(
			apiCreateTaskSchema.safeParse({ title: 'x', priority: 1, dueDate: '08/25/2026' }).success
		).toBe(false);
	});

	it('accepts tags as an array of strings', () => {
		const result = apiCreateTaskSchema.safeParse({
			title: 'x',
			priority: 1,
			tags: ['errands', 'urgent']
		});
		expect(result.success).toBe(true);
	});
});

describe('apiUpdateTaskSchema', () => {
	it('accepts an empty partial update', () => {
		expect(apiUpdateTaskSchema.safeParse({}).success).toBe(true);
	});

	it('accepts null for nullable fields to clear them', () => {
		const result = apiUpdateTaskSchema.safeParse({ description: null, tags: null, dueDate: null });
		expect(result.success).toBe(true);
	});
});

describe('apiTaskListQuerySchema', () => {
	it('defaults limit to 50', () => {
		const result = apiTaskListQuerySchema.safeParse({});
		expect(result.data?.limit).toBe(50);
	});

	it('coerces string query params to numbers', () => {
		const result = apiTaskListQuerySchema.safeParse({ priority: '3', limit: '10' });
		expect(result.data).toEqual({ priority: 3, limit: 10 });
	});

	it('rejects a limit above 200', () => {
		expect(apiTaskListQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
	});

	it('rejects an invalid state', () => {
		expect(apiTaskListQuerySchema.safeParse({ state: 'archived' }).success).toBe(false);
	});
});
