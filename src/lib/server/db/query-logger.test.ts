import { describe, expect, it, vi } from 'vitest';

const mockDebug = vi.hoisted(() => vi.fn<(...args: unknown[]) => void>());

vi.mock('$lib/server/logger', () => ({ logger: { debug: mockDebug } }));

import { createQueryLogger } from './query-logger';

describe('createQueryLogger', () => {
	it('disables query logging outside dev', () => {
		expect(createQueryLogger(false)).toBe(false);
	});

	it('logs SQL text but never params in dev', () => {
		const queryLogger = createQueryLogger(true);
		if (!queryLogger) throw new Error('expected a logger in dev');

		queryLogger.logQuery('insert into "verification" values (?)', ['reset-password:secret-token']);

		expect(mockDebug).toHaveBeenCalledWith('SQL', {
			query: 'insert into "verification" values (?)'
		});
		expect(JSON.stringify(mockDebug.mock.calls)).not.toContain('secret-token');
	});
});
