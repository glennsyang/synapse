import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRoutineFindFirst = vi.hoisted(() =>
	vi.fn<(args: unknown) => Promise<unknown>>(async () => undefined)
);
const mockInsertValues = vi.hoisted(() =>
	vi.fn<(args: unknown) => Promise<unknown>>(async () => undefined)
);
const mockUpdateWhere = vi.hoisted(() =>
	vi.fn<(args: unknown) => Promise<unknown>>(async () => undefined)
);

vi.mock('$lib/server/db', () => ({
	getDb: () => ({
		query: {
			meditationRoutines: { findFirst: mockRoutineFindFirst },
			meditationSchedules: {
				findFirst: vi.fn<(args: unknown) => Promise<unknown>>(async () => undefined)
			}
		},
		insert: vi.fn<(...args: unknown[]) => unknown>(() => ({ values: mockInsertValues })),
		update: vi.fn<(...args: unknown[]) => unknown>(() => ({
			set: vi.fn<(...args: unknown[]) => unknown>(() => ({ where: mockUpdateWhere }))
		}))
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

const { actions } = await import('./+page.server');

function formRequest(fields: Record<string, string>): Request {
	const formData = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		formData.append(key, value);
	}
	return new Request('http://localhost/meditation/routines/routine-a', {
		method: 'POST',
		body: formData
	});
}

const userId = 'user-b';
const locals = { user: { id: userId } } as App.Locals;
const routineId = 'routine-a';

describe('meditation routine [id] actions — ownership scoping (issue #354)', () => {
	beforeEach(() => {
		mockRoutineFindFirst.mockReset().mockResolvedValue(undefined);
		mockInsertValues.mockReset();
		mockUpdateWhere.mockReset();
	});

	it('completeSession returns 404 and does not insert a session for an unowned, non-predefined routine', async () => {
		const request = formRequest({ completed_at: new Date().toISOString() });

		const result = await actions.completeSession({
			request,
			params: { id: routineId },
			locals
		} as never);

		expect(mockRoutineFindFirst).toHaveBeenCalled();
		expect((result as { status?: number })?.status).toBe(404);
		expect(mockInsertValues).not.toHaveBeenCalled();
	});

	it('completeSession inserts a session when the routine is owned by the caller', async () => {
		mockRoutineFindFirst.mockResolvedValue({ id: routineId, userId, isPredefined: false });
		const request = formRequest({ completed_at: new Date().toISOString() });

		await actions.completeSession({
			request,
			params: { id: routineId },
			locals
		} as never);

		expect(mockInsertValues).toHaveBeenCalled();
	});

	it('createSchedule returns 404 and does not write a schedule for an unowned, non-predefined routine', async () => {
		const request = formRequest({ cadence: 'daily', time: '08:00' });

		const result = await actions.createSchedule({
			request,
			params: { id: routineId },
			locals
		} as never);

		expect(mockRoutineFindFirst).toHaveBeenCalled();
		expect((result as { status?: number })?.status).toBe(404);
		expect(mockInsertValues).not.toHaveBeenCalled();
	});

	it('createSchedule inserts a schedule when the routine is owned by the caller', async () => {
		mockRoutineFindFirst.mockResolvedValue({ id: routineId, userId, isPredefined: false });
		const request = formRequest({ cadence: 'daily', time: '08:00' });

		await actions.createSchedule({
			request,
			params: { id: routineId },
			locals
		} as never);

		expect(mockInsertValues).toHaveBeenCalled();
	});
});
