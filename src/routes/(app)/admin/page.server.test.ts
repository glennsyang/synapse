import { isHttpError, isRedirect } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetDb = vi.hoisted(() => vi.fn<() => unknown>());
const mockFindMany = vi.hoisted(() => vi.fn<(args: unknown) => Promise<unknown[]>>(async () => []));

// Stand-in for db.select().from().leftJoin().orderBy(), which resolves to no rows.
function selectChain(): unknown {
	const chain = {
		from: () => chain,
		leftJoin: () => chain,
		orderBy: async () => []
	};
	return chain;
}

vi.mock('$lib/server/db', () => ({ getDb: mockGetDb }));

const mockCreateUser = vi.hoisted(() =>
	vi.fn<(args: { body: Record<string, string> }) => Promise<{ user: { id: string } }>>()
);
const mockFindFirst = vi.hoisted(() => vi.fn<(args: unknown) => Promise<unknown>>());
const mockSendWelcomeEmail = vi.hoisted(() =>
	vi.fn<(to: string, name: string, appUrl: string) => Promise<void>>()
);
const mockSendAuthAlerts = vi.hoisted(() => vi.fn<(message: string) => Promise<boolean>>());

vi.mock('$app/env/private', () => ({
	BETTER_AUTH_BASE_URL: 'https://synapse.example.com',
	FLY_APP_NAME: 'synapse-test'
}));

vi.mock('$lib/server/auth', () => ({
	auth: { api: { createUser: mockCreateUser } },
	allowedEmails: new Set(['admin@example.com', 'allowed@example.com'])
}));

vi.mock('$lib/server/email', () => ({ sendWelcomeEmail: mockSendWelcomeEmail }));

vi.mock('$lib/server/notifications', () => ({ sendAuthAlerts: mockSendAuthAlerts }));

vi.mock('$lib/server/logger', () => ({
	logger: {
		debug: vi.fn<(...args: unknown[]) => void>(),
		info: vi.fn<(...args: unknown[]) => void>(),
		warn: vi.fn<(...args: unknown[]) => void>(),
		error: vi.fn<(...args: unknown[]) => void>()
	}
}));

const { load, actions } = await import('./+page.server');

async function runLoad(locals: App.Locals): Promise<unknown> {
	const url = new URL('http://localhost/admin');
	return load({ locals, url, request: new Request(url) } as never);
}

describe('admin page load — role check', () => {
	beforeEach(() => {
		mockFindMany.mockClear();
		mockGetDb.mockReset();
		mockGetDb.mockImplementation(() => ({
			query: {
				user: { findMany: mockFindMany },
				people: { findMany: mockFindMany },
				apiAuditLog: { findMany: mockFindMany },
				visits: { findMany: mockFindMany }
			},
			select: selectChain
		}));
	});

	it('throws 403 for a non-admin without touching the database', async () => {
		const locals = { user: { id: 'user-a', role: 'user' } } as App.Locals;

		const err = await runLoad(locals).catch((e: unknown) => e);

		expect(isHttpError(err, 403)).toBe(true);
		expect(mockGetDb).not.toHaveBeenCalled();
		expect(mockFindMany).not.toHaveBeenCalled();
	});

	it('redirects to sign-in when there is no user', async () => {
		const err = await runLoad({} as App.Locals).catch((e: unknown) => e);

		expect(isRedirect(err)).toBe(true);
		expect(mockGetDb).not.toHaveBeenCalled();
	});

	it('returns dashboard data for an admin', async () => {
		const locals = { user: { id: 'admin-a', role: 'admin' } } as App.Locals;

		const data = await runLoad(locals);

		expect(mockGetDb).toHaveBeenCalled();
		expect(data).toMatchObject({ users: [], archivedPeople: [], apiKeys: [], apiLogs: [] });
		expect(data).toHaveProperty('createApiKeyForm');
	});
});

const ADMIN = { id: 'admin-a', role: 'admin', email: 'admin@example.com' };

type ActionResult = { status?: number; data?: Record<string, unknown> } & Record<string, unknown>;

async function runAction(
	name: 'createUser' | 'sendWelcomeEmail',
	fields: Record<string, string>,
	localsUser: unknown = ADMIN
): Promise<ActionResult> {
	const url = new URL('http://localhost/admin');
	const request = new Request(url, { method: 'POST', body: new URLSearchParams(fields) });
	const locals = (localsUser ? { user: localsUser } : {}) as App.Locals;
	return (await actions[name]({ locals, url, request } as never)) as ActionResult;
}

describe('admin createUser action', () => {
	beforeEach(() => {
		mockCreateUser.mockReset();
		mockCreateUser.mockResolvedValue({ user: { id: 'new-user' } });
		mockSendWelcomeEmail.mockReset();
		mockSendWelcomeEmail.mockResolvedValue(undefined);
		mockSendAuthAlerts.mockReset();
		mockSendAuthAlerts.mockResolvedValue(true);
	});

	it('returns 403 for a non-admin without creating a user', async () => {
		const result = await runAction(
			'createUser',
			{ name: 'Ada', email: 'allowed@example.com' },
			{ id: 'user-a', role: 'user', email: 'u@example.com' }
		);

		expect(result.status).toBe(403);
		expect(mockCreateUser).not.toHaveBeenCalled();
	});

	it('returns 401 when signed out', async () => {
		const result = await runAction('createUser', { name: 'Ada', email: 'a@example.com' }, null);

		expect(result.status).toBe(401);
		expect(mockCreateUser).not.toHaveBeenCalled();
	});

	it('returns 400 for invalid input', async () => {
		const result = await runAction('createUser', { name: '', email: 'nope' });

		expect(result.status).toBe(400);
		expect(mockCreateUser).not.toHaveBeenCalled();
	});

	it('creates an allowlisted user with a generated password and sends the welcome email', async () => {
		const result = await runAction('createUser', {
			name: 'Ada',
			email: 'Allowed@Example.com',
			role: 'admin'
		});

		const body = mockCreateUser.mock.calls[0][0].body;
		expect(body).toMatchObject({ name: 'Ada', email: 'allowed@example.com', role: 'admin' });
		expect(body.password.length).toBeGreaterThanOrEqual(32);
		expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
			'allowed@example.com',
			'Ada',
			'https://synapse.example.com'
		);
		expect(mockSendAuthAlerts).toHaveBeenCalledOnce();
		expect(mockSendAuthAlerts.mock.calls[0][0]).not.toContain(body.password);
		expect(result.form).toMatchObject({ message: { type: 'success' } });
		expect(result).not.toHaveProperty('allowlistCommand');
	});

	it('skips the welcome email and returns the allowlist command for a non-allowlisted email', async () => {
		const result = await runAction('createUser', { name: 'Bob', email: 'bob@example.com' });

		expect(mockCreateUser).toHaveBeenCalledOnce();
		expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
		expect(result.allowlistCommand).toBe(
			'fly secrets set ALLOWED_EMAILS="admin@example.com,allowed@example.com,bob@example.com" -a synapse-test'
		);
	});

	it('reports a welcome email failure without failing the request', async () => {
		mockSendWelcomeEmail.mockRejectedValue(new Error('Brevo down'));

		const result = await runAction('createUser', { name: 'Ada', email: 'allowed@example.com' });

		expect(result.form).toMatchObject({ message: { type: 'error' } });
		expect(result.status).toBeUndefined();
	});

	it('returns a field error for a duplicate email', async () => {
		mockCreateUser.mockRejectedValue({
			body: { code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' }
		});

		const result = await runAction('createUser', { name: 'Ada', email: 'allowed@example.com' });

		expect(result.status).toBe(400);
		expect(result.data?.form).toMatchObject({
			errors: { email: ['A user with this email already exists.'] }
		});
		expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
	});

	it('returns 500 when user creation fails unexpectedly', async () => {
		mockCreateUser.mockRejectedValue(new Error('db locked'));

		const result = await runAction('createUser', { name: 'Ada', email: 'allowed@example.com' });

		expect(result.status).toBe(500);
	});
});

describe('admin sendWelcomeEmail action', () => {
	beforeEach(() => {
		mockFindFirst.mockReset();
		mockSendWelcomeEmail.mockReset();
		mockSendWelcomeEmail.mockResolvedValue(undefined);
		mockSendAuthAlerts.mockReset();
		mockGetDb.mockReset();
		mockGetDb.mockImplementation(() => ({ query: { user: { findFirst: mockFindFirst } } }));
	});

	it('returns 403 for a non-admin', async () => {
		const result = await runAction(
			'sendWelcomeEmail',
			{ userId: 'u1' },
			{ id: 'user-a', role: 'user', email: 'u@example.com' }
		);

		expect(result.status).toBe(403);
		expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
	});

	it('returns 404 for an unknown user', async () => {
		mockFindFirst.mockResolvedValue(undefined);

		const result = await runAction('sendWelcomeEmail', { userId: 'missing' });

		expect(result.status).toBe(404);
	});

	it('refuses a user who is not allowlisted yet', async () => {
		mockFindFirst.mockResolvedValue({ id: 'u1', email: 'bob@example.com', name: 'Bob' });

		const result = await runAction('sendWelcomeEmail', { userId: 'u1' });

		expect(result.status).toBe(400);
		expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
	});

	it('sends the welcome email to an allowlisted user', async () => {
		mockFindFirst.mockResolvedValue({ id: 'u1', email: 'allowed@example.com', name: 'Ada' });

		const result = await runAction('sendWelcomeEmail', { userId: 'u1' });

		expect(result).toMatchObject({ success: true });
		expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
			'allowed@example.com',
			'Ada',
			'https://synapse.example.com'
		);
		expect(mockSendAuthAlerts).toHaveBeenCalledOnce();
	});
});
