import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockVerifyApiKey = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>());
const mockLoggerWarn = vi.hoisted(() => vi.fn<(...args: unknown[]) => void>());

vi.mock('../auth', () => ({
	auth: { api: { verifyApiKey: mockVerifyApiKey } }
}));

vi.mock('$lib/server/logger', () => ({
	logger: {
		warn: mockLoggerWarn,
		error: vi.fn<(...args: unknown[]) => void>(),
		info: vi.fn<(...args: unknown[]) => void>(),
		debug: vi.fn<(...args: unknown[]) => void>()
	}
}));

import { requireApiKey } from './require-api-key';

function request(headers: Record<string, string> = {}): Request {
	return new Request('https://example.com/api/v1/tasks', { headers });
}

describe('requireApiKey', () => {
	beforeEach(() => {
		mockVerifyApiKey.mockReset();
		mockLoggerWarn.mockReset();
	});

	it('rejects a missing Authorization header', async () => {
		const result = await requireApiKey(request(), 'tasks:read');
		expect(result).toEqual({
			ok: false,
			status: 401,
			code: 'missing_header',
			message: expect.any(String)
		});
		expect(mockVerifyApiKey).not.toHaveBeenCalled();
		expect(mockLoggerWarn).toHaveBeenCalled();
	});

	it('rejects a malformed Authorization header', async () => {
		const result = await requireApiKey(request({ authorization: 'Bearer' }), 'tasks:read');
		expect(result).toEqual({
			ok: false,
			status: 401,
			code: 'malformed_header',
			message: expect.any(String)
		});
	});

	it('passes the required scope as a permissions record to verifyApiKey', async () => {
		mockVerifyApiKey.mockResolvedValue({
			valid: true,
			error: null,
			key: { id: 'key1', referenceId: 'user1' }
		});

		await requireApiKey(request({ authorization: 'Bearer sk_test_123' }), 'tasks:write');

		expect(mockVerifyApiKey).toHaveBeenCalledWith({
			body: { key: 'sk_test_123', permissions: { tasks: ['write'] } }
		});
	});

	it('returns the api key id and user id on success', async () => {
		mockVerifyApiKey.mockResolvedValue({
			valid: true,
			error: null,
			key: { id: 'key1', referenceId: 'user1' }
		});

		const result = await requireApiKey(
			request({ authorization: 'Bearer sk_test_123' }),
			'mood:read'
		);

		expect(result).toEqual({ ok: true, apiKeyId: 'key1', userId: 'user1' });
	});

	it('maps an invalid key (or insufficient scope) to a generic 401', async () => {
		mockVerifyApiKey.mockResolvedValue({
			valid: false,
			error: { message: 'not found', code: 'KEY_NOT_FOUND' },
			key: null
		});

		const result = await requireApiKey(
			request({ authorization: 'Bearer sk_test_123' }),
			'tasks:write'
		);

		expect(result).toEqual({
			ok: false,
			status: 401,
			code: 'invalid_api_key',
			message: expect.any(String)
		});
	});

	it('maps a rate-limited key to 429', async () => {
		mockVerifyApiKey.mockResolvedValue({
			valid: false,
			error: { message: 'rate limited', code: 'RATE_LIMITED' },
			key: null
		});

		const result = await requireApiKey(
			request({ authorization: 'Bearer sk_test_123' }),
			'tasks:read'
		);

		expect(result).toEqual({
			ok: false,
			status: 429,
			code: 'rate_limited',
			message: expect.any(String)
		});
	});

	it('maps a quota-exhausted key to 429', async () => {
		mockVerifyApiKey.mockResolvedValue({
			valid: false,
			error: { message: 'usage exceeded', code: 'USAGE_EXCEEDED' },
			key: null
		});

		const result = await requireApiKey(
			request({ authorization: 'Bearer sk_test_123' }),
			'tasks:read'
		);

		expect(result.ok).toBe(false);
		expect((result as { status: number }).status).toBe(429);
	});

	it('never logs the raw key value on failure', async () => {
		mockVerifyApiKey.mockResolvedValue({
			valid: false,
			error: { message: 'invalid', code: 'INVALID_API_KEY' },
			key: null
		});

		await requireApiKey(request({ authorization: 'Bearer sk_test_super_secret' }), 'tasks:read');

		for (const call of mockLoggerWarn.mock.calls) {
			expect(JSON.stringify(call)).not.toContain('sk_test_super_secret');
		}
	});
});
