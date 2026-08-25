import { describe, expect, it } from 'vitest';

import { ApiWriteError } from './errors';

describe('ApiWriteError', () => {
	it('carries the code, message, and status', () => {
		const error = new ApiWriteError('not_found', 'Task not found.', 404);
		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe('ApiWriteError');
		expect(error.code).toBe('not_found');
		expect(error.message).toBe('Task not found.');
		expect(error.status).toBe(404);
	});
});
