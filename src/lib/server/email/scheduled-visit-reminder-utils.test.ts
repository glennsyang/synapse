import { describe, expect, it } from 'vitest';

import {
	buildScheduledVisitReminderEntityId,
	buildScheduledVisitReminderSubject,
	formatReminderDate,
	getDateDaysAhead
} from './scheduled-visit-reminder-utils';

describe('getDateDaysAhead', () => {
	it('returns the correct date when adding positive days', () => {
		expect(getDateDaysAhead(new Date('2026-01-01'), 7)).toBe('2026-01-08');
		expect(getDateDaysAhead(new Date('2026-03-25'), 10)).toBe('2026-04-04');
	});

	it('handles month-boundary rollover correctly', () => {
		expect(getDateDaysAhead(new Date('2026-01-28'), 7)).toBe('2026-02-04');
	});

	it('handles year-boundary rollover correctly', () => {
		expect(getDateDaysAhead(new Date('2025-12-28'), 7)).toBe('2026-01-04');
	});

	it('returns the same date when days is 0', () => {
		expect(getDateDaysAhead(new Date('2026-06-15'), 0)).toBe('2026-06-15');
	});
});

describe('formatReminderDate', () => {
	it('formats a YYYY-MM-DD string as Month D, YYYY', () => {
		expect(formatReminderDate('2026-03-15')).toBe('March 15, 2026');
	});

	it('formats single-digit days without zero padding', () => {
		expect(formatReminderDate('2026-01-07')).toBe('January 7, 2026');
	});

	it('formats the last day of the year correctly', () => {
		expect(formatReminderDate('2025-12-31')).toBe('December 31, 2025');
	});
});

describe('buildScheduledVisitReminderEntityId', () => {
	it('prefixes the visit id with the reminder namespace', () => {
		expect(buildScheduledVisitReminderEntityId('visit_abc123')).toBe(
			'scheduled_visit:visit_abc123'
		);
	});
});

describe('buildScheduledVisitReminderSubject', () => {
	it('includes the person name in the subject line', () => {
		const subject = buildScheduledVisitReminderSubject('Alice');
		expect(subject).toContain('Alice');
		expect(subject).toContain('one week');
	});

	it('includes the emoji marker in the subject', () => {
		expect(buildScheduledVisitReminderSubject('Bob')).toContain('📅');
	});
});
