import { beforeEach, describe, expect, it, vi } from 'vitest';

const { resetPasswordMock, rateLimitCheckMock } = vi.hoisted(() => ({
	resetPasswordMock: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
	rateLimitCheckMock: vi.fn<() => Promise<{ limited: boolean; retryAfter: number }>>()
}));

vi.mock('$lib/server/auth', () => ({
	auth: { api: { resetPassword: resetPasswordMock } }
}));

vi.mock('$lib/server/rate-limiter', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/rate-limiter')>();
	return {
		...actual,
		createAuthRateLimiter: () => ({ check: rateLimitCheckMock })
	};
});

import { actions, load } from './+page.server';

function loadEvent(url: string) {
	return {
		locals: { user: null },
		url: new URL(url),
		request: new Request(url),
		route: { id: '/(auth)/reset-password' }
	} as never;
}

describe('reset-password load', () => {
	it('marks the token invalid when the token param is missing', async () => {
		const result = await load(loadEvent('https://synapse.example.com/reset-password'));

		expect(result).toMatchObject({ token: null, invalid: true });
	});

	it("marks the token invalid when Better Auth's verifier redirects back with ?error=", async () => {
		const result = await load(
			loadEvent('https://synapse.example.com/reset-password?token=bad&error=INVALID_TOKEN')
		);

		expect(result).toMatchObject({ token: 'bad', invalid: true });
	});

	it('marks the token valid when a token is present with no ?error=', async () => {
		const result = await load(loadEvent('https://synapse.example.com/reset-password?token=good'));

		expect(result).toMatchObject({ token: 'good', invalid: false });
	});
});

describe('reset-password default action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		rateLimitCheckMock.mockResolvedValue({ limited: false, retryAfter: 0 });
	});

	function resetRequest(body: Record<string, string>) {
		return new Request('https://synapse.example.com/reset-password', {
			method: 'POST',
			body: new URLSearchParams(body)
		});
	}

	it('returns a 429 with a retry-after message and skips Better Auth when rate limited', async () => {
		rateLimitCheckMock.mockResolvedValueOnce({ limited: true, retryAfter: 17 });

		const request = resetRequest({
			password: 'a-valid-password-123',
			confirmPassword: 'a-valid-password-123',
			token: 'good'
		});
		const result = await actions.default({ request } as never);

		expect(resetPasswordMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({
			status: 429,
			data: {
				form: {
					message: { type: 'error', text: 'Too many attempts. Please try again in 17 seconds.' }
				}
			}
		});
	});
});
