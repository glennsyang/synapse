import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockValues = vi.hoisted(() =>
	vi.fn<(entry: unknown) => Promise<void>>(async () => undefined)
);
const mockInsert = vi.hoisted(() =>
	vi.fn<() => { values: typeof mockValues }>(() => ({ values: mockValues }))
);
const mockLoggerError = vi.hoisted(() => vi.fn<(...args: unknown[]) => void>());

vi.mock('$lib/server/db', () => ({ getDb: () => ({ insert: mockInsert }) }));
vi.mock('$lib/server/db/schema', () => ({ apiAuditLog: {} }));
vi.mock('$lib/server/logger', () => ({
	logger: {
		error: mockLoggerError,
		warn: vi.fn<(...args: unknown[]) => void>(),
		info: vi.fn<(...args: unknown[]) => void>()
	}
}));

import { recordApiWrite } from './audit-log';

const entry = {
	apiKeyId: 'key-1',
	userId: 'user-1',
	method: 'POST',
	path: '/api/v1/tasks',
	action: 'tasks:write',
	statusCode: 201
};

describe('recordApiWrite', () => {
	beforeEach(() => {
		mockInsert.mockClear();
		mockValues.mockClear();
		mockLoggerError.mockClear();
	});

	it('inserts the given entry', async () => {
		await recordApiWrite(entry);
		expect(mockValues).toHaveBeenCalledWith(entry);
	});

	it('logs and swallows a DB failure instead of throwing', async () => {
		mockValues.mockRejectedValueOnce(new Error('db down'));

		await expect(recordApiWrite(entry)).resolves.toBeUndefined();
		expect(mockLoggerError).toHaveBeenCalled();
	});
});
