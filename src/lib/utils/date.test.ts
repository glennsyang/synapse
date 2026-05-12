import { describe, expect, it } from 'vitest';

import {
	addDaysToDateString,
	formatDateLong,
	formatDateMedium,
	formatDateShort,
	formatTime12Hour,
	formatTimeFromTimestamp,
	formatTimestampLong,
	formatTimestampMedium,
	formatTimestampShort,
	getDateRange,
	getDateUrgencyStatus,
	getRollingDateRange,
	getStartOfMonth,
	getStartOfQuarter,
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

	it('handles leap year day correctly', () => {
		expect(addDaysToDateString('2024-02-28', 1)).toBe('2024-02-29');
		expect(addDaysToDateString('2024-02-29', 1)).toBe('2024-03-01');
	});

	it('handles year-boundary rollover', () => {
		expect(addDaysToDateString('2025-12-31', 1)).toBe('2026-01-01');
		expect(addDaysToDateString('2026-01-01', -1)).toBe('2025-12-31');
	});
});

describe('date range helpers', () => {
	it('returns an inclusive range of dates between two dates', () => {
		expect(getDateRange('2026-03-01', '2026-03-04')).toEqual([
			'2026-03-01',
			'2026-03-02',
			'2026-03-03',
			'2026-03-04'
		]);
	});

	it('returns a single-element array when start equals end', () => {
		expect(getDateRange('2026-05-10', '2026-05-10')).toEqual(['2026-05-10']);
	});

	it('returns the start of the month for any day in that month', () => {
		expect(getStartOfMonth('2026-03-15')).toBe('2026-03-01');
		expect(getStartOfMonth('2026-01-01')).toBe('2026-01-01');
	});

	it('returns the Monday start of the week for Sunday', () => {
		expect(getStartOfWeek('2026-03-15')).toBe('2026-03-09');
	});

	it('returns the quarter start for each quarter', () => {
		expect(getStartOfQuarter('2026-01-15')).toBe('2026-01-01');
		expect(getStartOfQuarter('2026-04-30')).toBe('2026-04-01');
		expect(getStartOfQuarter('2026-07-01')).toBe('2026-07-01');
		expect(getStartOfQuarter('2026-10-31')).toBe('2026-10-01');
	});
});

describe('date display formatters', () => {
	it('formats a date in long form with weekday', () => {
		const formatted = formatDateLong('2026-03-09');
		expect(formatted).toContain('Monday');
		expect(formatted).toContain('March');
		expect(formatted).toContain('2026');
	});

	it('formats a date in medium form with abbreviated weekday', () => {
		const formatted = formatDateMedium('2026-03-09');
		expect(formatted).toContain('Mon');
		expect(formatted).toContain('Mar');
		expect(formatted).toContain('9');
	});

	it('formats a date in short form without a weekday', () => {
		const formatted = formatDateShort('2026-03-09');
		expect(formatted).toContain('Mar');
		expect(formatted).toContain('2026');
		expect(formatted).not.toContain('Mon');
	});
});

describe('timestamp formatters', () => {
	it('formats a UTC timestamp in long form with time', () => {
		const formatted = formatTimestampLong('2026-03-09T20:30:00.000Z');
		expect(formatted).toContain('Mar');
		expect(formatted).toContain('2026');
	});

	it('formats a UTC timestamp in medium form with abbreviated weekday', () => {
		const formatted = formatTimestampMedium('2026-03-09T20:30:00.000Z');
		expect(formatted).toContain('Mar');
		expect(formatted).toContain('9');
	});

	it('formats a UTC timestamp in short form with date only', () => {
		const formatted = formatTimestampShort('2026-03-09T20:30:00.000Z');
		expect(formatted).toContain('Mar');
		expect(formatted).toContain('2026');
	});

	it('extracts just the time portion from a timestamp', () => {
		const formatted = formatTimeFromTimestamp('2026-03-09T14:30:00.000Z');
		expect(formatted).toContain('30');
	});

	it('converts 24-hour time to 12-hour AM/PM format', () => {
		expect(formatTime12Hour('14:30')).toContain('2:30');
		expect(formatTime12Hour('14:30')).toContain('PM');
		expect(formatTime12Hour('09:05')).toContain('9:05');
		expect(formatTime12Hour('09:05')).toContain('AM');
	});
});
