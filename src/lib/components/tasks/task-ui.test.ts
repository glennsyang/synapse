import { describe, expect, it } from 'vitest';

import { formatTaskDisplayId } from './task-ui';

describe('task UI helpers', () => {
	it('formats task numbers with the SYN prefix and minimum zero padding', () => {
		expect(formatTaskDisplayId(1)).toBe('SYN-001');
		expect(formatTaskDisplayId(27)).toBe('SYN-027');
		expect(formatTaskDisplayId(384)).toBe('SYN-384');
	});

	it('keeps larger task numbers intact without truncation', () => {
		expect(formatTaskDisplayId(1204)).toBe('SYN-1204');
	});
});
