import { describe, expect, it } from 'vitest';

import { apiPeopleListQuerySchema } from './people';

describe('apiPeopleListQuerySchema', () => {
	it('defaults includeArchived to false when omitted', () => {
		expect(apiPeopleListQuerySchema.safeParse({}).data?.includeArchived).toBe(false);
	});

	it('parses includeArchived=true', () => {
		expect(
			apiPeopleListQuerySchema.safeParse({ includeArchived: 'true' }).data?.includeArchived
		).toBe(true);
	});

	it('rejects a non-boolean-ish value', () => {
		expect(apiPeopleListQuerySchema.safeParse({ includeArchived: 'yes' }).success).toBe(false);
	});
});
