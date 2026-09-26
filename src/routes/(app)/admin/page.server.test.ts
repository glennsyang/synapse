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

vi.mock('$lib/server/auth', () => ({ auth: { api: {} } }));

vi.mock('$lib/server/logger', () => ({
	logger: {
		debug: vi.fn<(...args: unknown[]) => void>(),
		info: vi.fn<(...args: unknown[]) => void>(),
		warn: vi.fn<(...args: unknown[]) => void>(),
		error: vi.fn<(...args: unknown[]) => void>()
	}
}));

const { load } = await import('./+page.server');

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
