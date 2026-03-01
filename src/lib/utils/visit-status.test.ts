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

	it('marks person as scheduled when latest follow-up is today or later', () => {
		const redVisitDate = dateDaysAgo(400);
		const today = new Date().toISOString().split('T')[0];

		const result = calculatePersonVisitStatus(redVisitDate, false, today, today);

		expect(result.status).toBe('scheduled');
		expect(result.daysSinceLastVisit).toBeGreaterThan(365);
		expect(result.daysUntilStatusChange).toBeNull();
	});

	it('gives scheduled precedence over exempt', () => {
		const redVisitDate = dateDaysAgo(400);
		const today = new Date().toISOString().split('T')[0];

		const result = calculatePersonVisitStatus(redVisitDate, true, today, today);

		expect(result.status).toBe('scheduled');
	});

	it('returns normal status when latest follow-up is in the past', () => {
		const redVisitDate = dateDaysAgo(400);
		const yesterday = dateDaysAgo(1);
		const today = new Date().toISOString().split('T')[0];

		const result = calculatePersonVisitStatus(redVisitDate, false, yesterday, today);

		expect(result.status).toBe('red');
	});

	it('exposes scheduled label and priority ordering', () => {
		expect(getStatusLabel('scheduled')).toBe('Scheduled');
		expect(getStatusPriority('scheduled')).toBeGreaterThan(getStatusPriority('green'));
		expect(getStatusPriority('scheduled')).toBeLessThan(getStatusPriority('none'));
	});
});
