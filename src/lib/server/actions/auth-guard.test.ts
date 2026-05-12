import type { RequestEvent } from '@sveltejs/kit';
import { isRedirect } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';

import { getUser, requireAuth } from './auth-guard';

type MockLocals = App.Locals;

function makeLocals(overrides: Partial<MockLocals> = {}): MockLocals {
	return {
		user: undefined,
		session: undefined,
		requestId: 'test-request-id',
		...overrides
	};
}

function makeEvent(overrides: Partial<MockLocals> = {}): RequestEvent {
	return { locals: makeLocals(overrides) } as unknown as RequestEvent;
}

const mockUser = { id: 'user_123', name: 'Alice', email: 'alice@example.com' };

describe('requireAuth', () => {
	it('returns fail(401) when the user is not authenticated', async () => {
		const wrapped = requireAuth(async () => ({ ok: true }));
		const result = await wrapped(makeEvent());

		expect(result).toMatchObject({ status: 401 });
	});

	it('calls the handler and returns its result when the user is authenticated', async () => {
		const handler = vi.fn().mockResolvedValue({ success: true });
		const wrapped = requireAuth(handler);

		const result = await wrapped(makeEvent({ user: mockUser as App.Locals['user'] }));

		expect(handler).toHaveBeenCalledOnce();
		expect(handler).toHaveBeenCalledWith(
			expect.objectContaining({ locals: expect.anything() }),
			mockUser
		);
		expect(result).toEqual({ success: true });
	});

	it('passes the authenticated user as the second argument to the handler', async () => {
		let capturedUser: unknown;
		const wrapped = requireAuth(async (_event, user) => {
			capturedUser = user;
			return null;
		});

		await wrapped(makeEvent({ user: mockUser as App.Locals['user'] }));

		expect(capturedUser).toBe(mockUser);
	});
});

describe('getUser', () => {
	it('returns the user from locals when authenticated', () => {
		const locals = makeLocals({ user: mockUser as App.Locals['user'] });
		const user = getUser(locals);
		expect(user).toBe(mockUser);
	});

	it('throws a redirect to /sign-in when the user is missing', () => {
		const locals = makeLocals({ user: undefined });

		expect(() => getUser(locals)).toThrow();

		try {
			getUser(locals);
		} catch (e) {
			expect(isRedirect(e)).toBe(true);
		}
	});
});
