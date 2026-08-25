import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRecordApiWrite = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<void>>());
const mockLoggerError = vi.hoisted(() => vi.fn<(...args: unknown[]) => void>());

vi.mock('./audit-log', () => ({ recordApiWrite: mockRecordApiWrite }));
vi.mock('$lib/server/logger', () => ({
	logger: {
		error: mockLoggerError,
		warn: vi.fn<(...args: unknown[]) => void>(),
		info: vi.fn<(...args: unknown[]) => void>()
	}
}));

import { ApiWriteError } from './errors';
import { handleApiWrite } from './handle-write';

const context = {
	apiKeyId: 'key-1',
	userId: 'user-1',
	method: 'POST',
	path: '/api/v1/tasks',
	action: 'tasks:write'
};

describe('handleApiWrite', () => {
	beforeEach(() => {
		mockRecordApiWrite.mockClear();
		mockLoggerError.mockClear();
	});

	it('returns the success envelope and records a success audit entry', async () => {
		const response = await handleApiWrite(context, async () => ({ id: 'task-1' }), {
			successStatus: 201,
			failureMessage: 'Failed to create task'
		});

		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({ data: { id: 'task-1' } });
		expect(mockRecordApiWrite).toHaveBeenCalledWith({ ...context, statusCode: 201 });
	});

	it('defaults to a 201 success status', async () => {
		const response = await handleApiWrite(context, async () => ({ id: 'task-1' }), {
			failureMessage: 'Failed to create task'
		});

		expect(response.status).toBe(201);
	});

	it('maps a thrown ApiWriteError to its typed error response and status', async () => {
		const response = await handleApiWrite(
			context,
			async () => {
				throw new ApiWriteError('not_found', 'Task not found.', 404);
			},
			{ failureMessage: 'Failed to update task' }
		);

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({
			error: { code: 'not_found', message: 'Task not found.' }
		});
		expect(mockRecordApiWrite).toHaveBeenCalledWith({ ...context, statusCode: 404 });
		expect(mockLoggerError).not.toHaveBeenCalled();
	});

	it('maps an unexpected error to a logged 500', async () => {
		const response = await handleApiWrite(
			context,
			async () => {
				throw new Error('boom');
			},
			{ failureMessage: 'Failed to create task' }
		);

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({
			error: { code: 'internal_error', message: 'Failed to create task.' }
		});
		expect(mockRecordApiWrite).toHaveBeenCalledWith({ ...context, statusCode: 500 });
		expect(mockLoggerError).toHaveBeenCalled();
	});
});
