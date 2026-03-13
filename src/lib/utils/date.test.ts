import { describe, expect, it } from 'vitest';

import {
	addDaysToDateString,
	getDateUrgencyStatus,
	getRollingDateRange,
	getStartOfWeek,
	getTodayString,
	getWeekDates,
	parseLocalDateString,
	toLocalDateString
} from './date';

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

	it('parses and formats local date strings without shifting timezone', () => {
		const parsed = parseLocalDateString('2026-03-08');

		expect(parsed.getFullYear()).toBe(2026);
		expect(parsed.getMonth()).toBe(2);
		expect(parsed.getDate()).toBe(8);
		expect(toLocalDateString(parsed)).toBe('2026-03-08');
	});

	it('returns Monday as the start of the week', () => {
		expect(getStartOfWeek('2026-03-08')).toBe('2026-03-02');
		expect(getStartOfWeek('2026-03-04')).toBe('2026-03-02');
	});

	it('adds and subtracts days across month boundaries', () => {
		expect(addDaysToDateString('2026-03-01', -1)).toBe('2026-02-28');
		expect(addDaysToDateString('2026-02-28', 1)).toBe('2026-03-01');
	});

	it('returns a Monday to Sunday week range', () => {
		expect(getWeekDates('2026-03-02')).toEqual([
			'2026-03-02',
			'2026-03-03',
			'2026-03-04',
			'2026-03-05',
			'2026-03-06',
			'2026-03-07',
			'2026-03-08'
		]);
	});

	it('returns a rolling date range ending on the provided day', () => {
		expect(getRollingDateRange('2026-03-08', 5)).toEqual([
			'2026-03-04',
			'2026-03-05',
			'2026-03-06',
			'2026-03-07',
			'2026-03-08'
		]);
	});

	it('uses Pacific time when calculating today across a UTC midnight boundary', () => {
		expect(getTodayString(new Date('2026-03-13T06:59:59.000Z'))).toBe('2026-03-12');
		expect(getTodayString(new Date('2026-03-13T07:00:00.000Z'))).toBe('2026-03-13');
	});
});
