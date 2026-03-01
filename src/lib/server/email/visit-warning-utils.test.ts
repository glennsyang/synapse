import { describe, expect, it } from 'vitest';

import {
	buildVisitWarningEntityId,
	buildVisitWarningSubject,
	formatVisitWarningDate,
	getVisitWarningStatus
} from './visit-warning-utils';

function dateDaysAgo(daysAgo: number): string {
	const date = new Date();
	date.setUTCDate(date.getUTCDate() - daysAgo);
	return date.toISOString().split('T')[0];
}

describe('visit warning utilities', () => {
	it('returns null for non-warning status windows', () => {
		const recentVisitDate = dateDaysAgo(200);
		expect(getVisitWarningStatus(recentVisitDate)).toBeNull();
	});

	it('maps yellow and red visit statuses to warning statuses', () => {
		const yellowVisitDate = dateDaysAgo(300);
		const redVisitDate = dateDaysAgo(400);

		expect(getVisitWarningStatus(yellowVisitDate)).toBe('yellow');
		expect(getVisitWarningStatus(redVisitDate)).toBe('critical');
	});

	it('suppresses warnings when latest visit has a scheduled follow-up', () => {
		const redVisitDate = dateDaysAgo(400);
		const futureFollowUpDate = dateDaysAgo(-10);

		expect(getVisitWarningStatus(redVisitDate, futureFollowUpDate)).toBeNull();
	});

	it('formats visit date as Month D, YYYY', () => {
		expect(formatVisitWarningDate('2025-08-06T16:00:00.000Z')).toBe('August 6, 2025');
	});

	it('builds status-aware warning entity ids', () => {
		expect(buildVisitWarningEntityId('person_123', 'yellow')).toBe('person_123:yellow');
		expect(buildVisitWarningEntityId('person_123', 'critical')).toBe('person_123:critical');
	});

	it('builds warning subjects with exact status wording', () => {
		expect(buildVisitWarningSubject('Alice', 'yellow')).toBe('Status: Yellow Warning for Alice');
		expect(buildVisitWarningSubject('Alice', 'critical')).toBe(
			'Status: Critical Warning for Alice'
		);
	});
});
