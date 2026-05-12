import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	assertDateIsEditable,
	buildDateRangeLabel,
	calculateCompletionPercentage,
	DailyAgendaMutationError,
	getEntriesToDeleteForDays,
	normalizeTemplateDays,
	parseTemplateDays,
	serializeTemplateDays
} from './daily-agenda';

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

describe('calculateCompletionPercentage', () => {
	it('returns 0 for an empty list', () => {
		expect(calculateCompletionPercentage([])).toBe(0);
	});

	it('returns 100 when all entries are completed', () => {
		const entries = [{ completed: true }, { completed: true }, { completed: true }];
		expect(calculateCompletionPercentage(entries)).toBe(100);
	});

	it('returns 0 when no entries are completed', () => {
		const entries = [{ completed: false }, { completed: false }];
		expect(calculateCompletionPercentage(entries)).toBe(0);
	});

	it('calculates the percentage and rounds to the nearest integer', () => {
		const entries = [{ completed: true }, { completed: true }, { completed: false }];
		expect(calculateCompletionPercentage(entries)).toBe(67);
	});

	it('rounds correctly for one out of four', () => {
		const entries = [
			{ completed: true },
			{ completed: false },
			{ completed: false },
			{ completed: false }
		];
		expect(calculateCompletionPercentage(entries)).toBe(25);
	});
});

describe('buildDateRangeLabel', () => {
	it('formats a date range with month and year on the end date', () => {
		const label = buildDateRangeLabel('2026-03-02', '2026-03-08');
		expect(label).toContain('Mar 2');
		expect(label).toContain('Mar 8');
		expect(label).toContain('2026');
	});

	it('handles a range spanning two months', () => {
		const label = buildDateRangeLabel('2026-03-30', '2026-04-05');
		expect(label).toContain('Mar');
		expect(label).toContain('Apr');
		expect(label).toContain('2026');
	});

	it('uses " - " as the separator', () => {
		const label = buildDateRangeLabel('2026-03-02', '2026-03-08');
		expect(label).toContain(' - ');
	});
});

describe('normalizeTemplateDays', () => {
	it('returns sorted, deduplicated days', () => {
		expect(normalizeTemplateDays([3, 1, 3, 0])).toEqual([0, 1, 3]);
	});

	it('filters out days outside 0-6', () => {
		expect(normalizeTemplateDays([0, 7, -1, 6])).toEqual([0, 6]);
	});

	it('returns every day as fallback when the input is empty', () => {
		expect(normalizeTemplateDays([])).toEqual(EVERY_DAY);
	});

	it('returns every day as fallback when all values are invalid', () => {
		expect(normalizeTemplateDays([7, 8, -1])).toEqual(EVERY_DAY);
	});

	it('accepts all days 0-6', () => {
		expect(normalizeTemplateDays([0, 1, 2, 3, 4, 5, 6])).toEqual(EVERY_DAY);
	});
});

describe('parseTemplateDays', () => {
	it('parses a valid JSON array of days', () => {
		expect(parseTemplateDays('[1, 3, 5]')).toEqual([1, 3, 5]);
	});

	it('deduplicates and sorts the parsed days', () => {
		expect(parseTemplateDays('[5, 1, 5, 3]')).toEqual([1, 3, 5]);
	});

	it('falls back to every day when the JSON is invalid', () => {
		expect(parseTemplateDays('not-json')).toEqual(EVERY_DAY);
		expect(parseTemplateDays('')).toEqual(EVERY_DAY);
	});

	it('falls back to every day when JSON is not an array', () => {
		expect(parseTemplateDays('"string"')).toEqual(EVERY_DAY);
		expect(parseTemplateDays('42')).toEqual(EVERY_DAY);
	});

	it('filters non-numeric values in the parsed array', () => {
		expect(parseTemplateDays('[1, "bad", 3, null]')).toEqual([1, 3]);
	});
});

describe('serializeTemplateDays', () => {
	it('serializes a valid set of days to a JSON string', () => {
		expect(serializeTemplateDays([1, 3, 5])).toBe('[1,3,5]');
	});

	it('deduplicates and sorts before serializing', () => {
		expect(serializeTemplateDays([5, 1, 5, 3])).toBe('[1,3,5]');
	});

	it('serializes an empty input as the full week fallback', () => {
		expect(serializeTemplateDays([])).toBe('[0,1,2,3,4,5,6]');
	});
});

describe('getEntriesToDeleteForDays', () => {
	it('returns ids of entries whose weekday is not in the allowed list', () => {
		// 2026-03-02 is a Monday (day 1), 2026-03-07 is a Saturday (day 6)
		const entries = [
			{ id: 'entry_mon', date: '2026-03-02' },
			{ id: 'entry_sat', date: '2026-03-07' }
		];

		// Only allow Monday (1)
		const toDelete = getEntriesToDeleteForDays(entries, [1]);
		expect(toDelete).toEqual(['entry_sat']);
	});

	it('returns an empty array when all entries fall on allowed days', () => {
		const entries = [
			{ id: 'entry_mon', date: '2026-03-02' },
			{ id: 'entry_tue', date: '2026-03-03' }
		];

		const toDelete = getEntriesToDeleteForDays(entries, [1, 2]);
		expect(toDelete).toHaveLength(0);
	});

	it('returns all entry ids when no days are allowed', () => {
		const entries = [
			{ id: 'entry_1', date: '2026-03-02' },
			{ id: 'entry_2', date: '2026-03-03' }
		];

		const toDelete = getEntriesToDeleteForDays(entries, []);
		expect(toDelete).toEqual(['entry_1', 'entry_2']);
	});

	it('returns an empty array for an empty entry list', () => {
		expect(getEntriesToDeleteForDays([], [1, 2, 3])).toHaveLength(0);
	});
});

describe('assertDateIsEditable', () => {
	beforeEach(() => {
		// Fix "today" to 2026-05-12 in Pacific time (UTC-7 during PDT)
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-05-12T12:00:00.000-07:00'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('does not throw for today', () => {
		expect(() => assertDateIsEditable('2026-05-12')).not.toThrow();
	});

	it('does not throw for future dates', () => {
		expect(() => assertDateIsEditable('2026-05-13')).not.toThrow();
		expect(() => assertDateIsEditable('2027-01-01')).not.toThrow();
	});

	it('throws DailyAgendaMutationError for past dates', () => {
		expect(() => assertDateIsEditable('2026-05-11')).toThrow(DailyAgendaMutationError);
		expect(() => assertDateIsEditable('2026-01-01')).toThrow(DailyAgendaMutationError);
	});

	it('sets the error code to read_only', () => {
		try {
			assertDateIsEditable('2026-05-11');
		} catch (e) {
			expect(e).toBeInstanceOf(DailyAgendaMutationError);
			if (e instanceof DailyAgendaMutationError) {
				expect(e.code).toBe('read_only');
			}
		}
	});
});
