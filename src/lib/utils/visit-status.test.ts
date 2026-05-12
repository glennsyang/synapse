import { describe, expect, it } from 'vitest';

import { getTodayString } from '$lib/utils/date';

import {
	calculatePersonVisitStatus,
	calculateVisitStatus,
	getStatusLabel,
	getStatusPriority
} from './visit-status';

function dateDaysAgo(daysAgo: number): string {
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);
	return getTodayString(date);
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
		const today = getTodayString();

		const result = calculatePersonVisitStatus(redVisitDate, false, today, today);

		expect(result.status).toBe('scheduled');
		expect(result.daysSinceLastVisit).toBeGreaterThan(365);
		expect(result.daysUntilStatusChange).toBeNull();
	});

	it('gives scheduled precedence over exempt', () => {
		const redVisitDate = dateDaysAgo(400);
		const today = getTodayString();

		const result = calculatePersonVisitStatus(redVisitDate, true, today, today);

		expect(result.status).toBe('scheduled');
	});

	it('returns normal status when latest follow-up is in the past', () => {
		const redVisitDate = dateDaysAgo(400);
		const yesterday = dateDaysAgo(1);
		const today = getTodayString();

		const result = calculatePersonVisitStatus(redVisitDate, false, yesterday, today);

		expect(result.status).toBe('red');
	});

	it('exposes scheduled label and priority ordering', () => {
		expect(getStatusLabel('scheduled')).toBe('Scheduled');
		expect(getStatusPriority('scheduled')).toBeGreaterThan(getStatusPriority('green'));
		expect(getStatusPriority('scheduled')).toBeLessThan(getStatusPriority('none'));
	});
});

describe('visit status boundary thresholds', () => {
	it('returns green well within the 9-month window', () => {
		const date = dateDaysAgo(180);
		const result = calculateVisitStatus(date);
		expect(result.status).toBe('green');
		expect(result.daysUntilStatusChange).toBeGreaterThan(0);
	});

	it('returns yellow in the 9-12 month range', () => {
		const date = dateDaysAgo(300);
		const result = calculateVisitStatus(date);
		expect(result.status).toBe('yellow');
		expect(result.daysUntilStatusChange).toBeGreaterThan(0);
	});

	it('returns yellow at 274 days (first reliable yellow day)', () => {
		const date = dateDaysAgo(274);
		expect(calculateVisitStatus(date).status).toBe('yellow');
	});

	it('returns red well beyond the 12-month mark', () => {
		const date = dateDaysAgo(400);
		const result = calculateVisitStatus(date);
		expect(result.status).toBe('red');
		expect(result.daysUntilStatusChange).toBeNull();
	});

	it('returns red at 365 days', () => {
		const date = dateDaysAgo(365);
		expect(calculateVisitStatus(date).status).toBe('red');
	});

	it('returns none when there is no visit date', () => {
		const result = calculateVisitStatus(null);
		expect(result.status).toBe('none');
		expect(result.daysSinceLastVisit).toBeNull();
		expect(result.daysUntilStatusChange).toBeNull();
	});
});
