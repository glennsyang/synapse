import { describe, expect, it } from 'vitest';

import {
	calculatePersonVisitStatus,
	calculateVisitStatus,
	getStatusLabel,
	getStatusPriority
} from './visit-status';

function dateDaysAgo(daysAgo: number): string {
	const date = new Date();
	date.setUTCDate(date.getUTCDate() - daysAgo);
	return date.toISOString().split('T')[0];
}

describe('visit status exemptions', () => {
	it('keeps non-exempt people on normal status rules', () => {
		const redVisitDate = dateDaysAgo(400);
		expect(calculateVisitStatus(redVisitDate).status).toBe('red');
		expect(calculatePersonVisitStatus(redVisitDate, false).status).toBe('red');
	});

	it('marks exempt people as exempt regardless of age', () => {
		const redVisitDate = dateDaysAgo(400);
		const result = calculatePersonVisitStatus(redVisitDate, true);

		expect(result.status).toBe('exempt');
		expect(result.daysSinceLastVisit).toBeGreaterThan(365);
		expect(result.daysUntilStatusChange).toBeNull();
	});

	it('handles exempt people with no visits', () => {
		const result = calculatePersonVisitStatus(null, true);

		expect(result.status).toBe('exempt');
		expect(result.daysSinceLastVisit).toBeNull();
		expect(result.daysUntilStatusChange).toBeNull();
	});

	it('exposes exempt label and priority ordering', () => {
		expect(getStatusLabel('exempt')).toBe('Exempt');
		expect(getStatusPriority('exempt')).toBeGreaterThan(getStatusPriority('none'));
	});
});
