import { describe, expect, it } from 'vitest';

import { createApiKeySchema, revokeApiKeySchema } from './api-key';

describe('createApiKeySchema', () => {
	it('accepts a valid key request', () => {
		const result = createApiKeySchema.safeParse({ name: 'Assistant', scopes: ['tasks:read'] });
		expect(result.success).toBe(true);
	});

	it('requires a name', () => {
		expect(createApiKeySchema.safeParse({ name: '', scopes: ['tasks:read'] }).success).toBe(false);
	});

	it('requires at least one scope', () => {
		expect(createApiKeySchema.safeParse({ name: 'Assistant', scopes: [] }).success).toBe(false);
	});

	it('rejects a scope outside API_SCOPES', () => {
		expect(
			createApiKeySchema.safeParse({ name: 'Assistant', scopes: ['transactions:read'] }).success
		).toBe(false);
	});

	it('rejects expiresInDays outside 1-365', () => {
		expect(
			createApiKeySchema.safeParse({
				name: 'Assistant',
				scopes: ['tasks:read'],
				expiresInDays: 400
			}).success
		).toBe(false);
	});
});

describe('revokeApiKeySchema', () => {
	it('requires a non-empty id', () => {
		expect(revokeApiKeySchema.safeParse({ id: '' }).success).toBe(false);
		expect(revokeApiKeySchema.safeParse({ id: 'key_abc' }).success).toBe(true);
	});
});
