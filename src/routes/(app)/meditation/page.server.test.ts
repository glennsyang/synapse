import { meditationRoutines } from '$lib/server/db/schema';
import { and, eq, like, or } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRoutinesFindMany = vi.hoisted(() =>
	vi.fn<(args: unknown) => Promise<unknown[]>>(async () => [])
);
const mockSchedulesFindMany = vi.hoisted(() =>
	vi.fn<(args: unknown) => Promise<unknown[]>>(async () => [])
);
const mockSessionsFindMany = vi.hoisted(() =>
	vi.fn<(args: unknown) => Promise<unknown[]>>(async () => [])
);

vi.mock('$lib/server/db', () => ({
	getDb: () => ({
		query: {
			meditationRoutines: { findMany: mockRoutinesFindMany },
			meditationSchedules: { findMany: mockSchedulesFindMany },
			meditationSessions: { findMany: mockSessionsFindMany }
		}
	})
}));

vi.mock('$lib/server/logger', () => ({
	logger: {
		debug: vi.fn<(...args: unknown[]) => void>(),
		info: vi.fn<(...args: unknown[]) => void>(),
		warn: vi.fn<(...args: unknown[]) => void>(),
		error: vi.fn<(...args: unknown[]) => void>()
	}
}));

const { load } = await import('./+page.server');

const userId = 'user-a';
const locals = { user: { id: userId } } as App.Locals;

describe('meditation list load — routine scoping (issue #352)', () => {
	beforeEach(() => {
		mockRoutinesFindMany.mockClear();
		mockSchedulesFindMany.mockClear();
		mockSessionsFindMany.mockClear();
	});

	it('scopes routines to the current user plus predefined ones when no filters are given', async () => {
		const url = new URL('http://localhost/meditation');
		await load({ locals, url, request: new Request(url) } as never);

		const expectedWhere = and(
			or(eq(meditationRoutines.userId, userId), eq(meditationRoutines.isPredefined, true))
		);

		expect(mockRoutinesFindMany).toHaveBeenCalledWith({ where: expectedWhere });
	});

	it('combines the ownership scope with search/mood/duration filters instead of replacing it', async () => {
		const url = new URL('http://localhost/meditation?search=focus&mood=Anxious&duration=10');
		await load({ locals, url, request: new Request(url) } as never);

		const expectedWhere = and(
			or(eq(meditationRoutines.userId, userId), eq(meditationRoutines.isPredefined, true)),
			or(
				like(meditationRoutines.title, '%focus%'),
				like(meditationRoutines.description, '%focus%')
			),
			or(like(meditationRoutines.moodTags, '%"Anxious"%')),
			eq(meditationRoutines.durationMinutes, 10)
		);

		expect(mockRoutinesFindMany).toHaveBeenCalledWith({ where: expectedWhere });
	});
});
