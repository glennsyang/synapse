import { describe, expect, it } from 'vitest';

import { parseBearerToken } from './bearer-token';

describe('parseBearerToken', () => {
	it('rejects a missing header', () => {
		expect(parseBearerToken(null)).toEqual({ reason: 'missing_header' });
	});

	it('rejects a non-bearer scheme', () => {
		expect(parseBearerToken('Basic abc123')).toEqual({ reason: 'invalid_scheme' });
	});

	it('rejects a malformed header', () => {
		expect(parseBearerToken('Bearer')).toEqual({ reason: 'malformed_header' });
		expect(parseBearerToken('Bearer token extra')).toEqual({ reason: 'malformed_header' });
		expect(parseBearerToken('Bearer ')).toEqual({ reason: 'malformed_header' });
	});

	it('extracts the token from a well-formed header', () => {
		expect(parseBearerToken('Bearer sk_live_abc123')).toEqual({ token: 'sk_live_abc123' });
	});
});
