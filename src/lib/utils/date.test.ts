import { describe, expect, it } from 'vitest';

import { getDateUrgencyStatus } from './date';

describe('date urgency helpers', () => {
	it('returns null when no due date exists', () => {
		expect(getDateUrgencyStatus(null, '2026-03-07')).toBeNull();
	});

	it('marks dates before today as overdue', () => {
		expect(getDateUrgencyStatus('2026-03-06', '2026-03-07')).toBe('overdue');
	});

	it('marks today as today', () => {
		expect(getDateUrgencyStatus('2026-03-07', '2026-03-07')).toBe('today');
	});

	it('marks future dates as upcoming', () => {
		expect(getDateUrgencyStatus('2026-03-08', '2026-03-07')).toBe('upcoming');
	});
});
