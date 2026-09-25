import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
	sendAuthAlerts: vi.fn<(message: string, title?: string, priority?: number) => void>()
}));

vi.mock('better-auth/api', async (importOriginal) => ({
	...(await importOriginal<typeof import('better-auth/api')>()),
	// Treat the middleware wrapper as identity so the callback can be called directly.
	createAuthMiddleware: (fn: unknown) => fn
}));

vi.mock('./notifications', () => ({ sendAuthAlerts: mockState.sendAuthAlerts }));

import {
	createAllowlistBeforeHook,
	createAllowlistSessionGuard,
	parseAllowedEmails
} from './auth-allowlist-hook';

type FakeCtx = { path: string; body?: { email?: unknown } };

const hook = createAllowlistBeforeHook(
	'Test App',
	parseAllowedEmails(' Owner@Example.com , partner@example.com,, ')
) as unknown as (ctx: FakeCtx) => Promise<void>;

beforeEach(() => mockState.sendAuthAlerts.mockClear());

describe('parseAllowedEmails', () => {
	it('trims, lowercases and drops empty entries', () => {
		expect(parseAllowedEmails(' A@x.com,, b@X.com ')).toEqual(new Set(['a@x.com', 'b@x.com']));
		expect(parseAllowedEmails('').size).toBe(0);
	});
});

describe('createAllowlistBeforeHook', () => {
	it('allows sign-in for an allowlisted email, case-insensitively', async () => {
		await expect(
			hook({ path: '/sign-in/email', body: { email: 'OWNER@example.com ' } })
		).resolves.toBeUndefined();
		expect(mockState.sendAuthAlerts).not.toHaveBeenCalled();
	});

	it('rejects a lookalike email that merely contains an allowlisted address', async () => {
		await expect(
			hook({ path: '/sign-in/email', body: { email: 'x+owner@example.com' } })
		).rejects.toThrow('Invalid email or password');
		expect(mockState.sendAuthAlerts).toHaveBeenCalledWith(
			expect.stringContaining('x+owner@example.com'),
			'Test App - Security Alert',
			4
		);
	});

	it('rejects with the same error Better Auth uses for a wrong password', async () => {
		await expect(
			hook({ path: '/sign-in/email', body: { email: 'stranger@example.com' } })
		).rejects.toMatchObject({
			statusCode: 401,
			body: { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' }
		});
	});

	it('rejects sign-up for a non-allowlisted email', async () => {
		await expect(
			hook({ path: '/sign-up/email', body: { email: 'stranger@example.com' } })
		).rejects.toThrow('Invalid email or password');
	});

	it('rejects a missing or non-string email', async () => {
		await expect(hook({ path: '/sign-in/email' })).rejects.toThrow('Invalid email or password');
		await expect(hook({ path: '/sign-in/email', body: { email: 42 } })).rejects.toThrow(
			'Invalid email or password'
		);
	});

	it('ignores unguarded paths', async () => {
		await expect(
			hook({ path: '/get-session', body: { email: 'stranger@example.com' } })
		).resolves.toBeUndefined();
	});
});

describe('createAllowlistSessionGuard', () => {
	const emails: Record<string, string> = { owner: 'Owner@Example.com', stranger: 'x@example.com' };
	const guard = createAllowlistSessionGuard(
		parseAllowedEmails('owner@example.com'),
		async (userId) => emails[userId]
	);

	it('allows a session for an allowlisted user, case-insensitively', async () => {
		await expect(guard({ userId: 'owner' })).resolves.toBeUndefined();
	});

	it('blocks a session for a non-allowlisted user (e.g. verify-email auto sign-in)', async () => {
		await expect(guard({ userId: 'stranger' })).rejects.toMatchObject({
			statusCode: 401,
			body: { code: 'INVALID_EMAIL_OR_PASSWORD' }
		});
	});

	it('blocks a session when the user cannot be found', async () => {
		await expect(guard({ userId: 'missing' })).rejects.toThrow('Invalid email or password');
	});
});
