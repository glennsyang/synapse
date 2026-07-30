import { describe, expect, it } from 'vitest';

import { buildWeatherJson, journalEntrySchema, journalFilterSchema } from './journal';

describe('journalEntrySchema', () => {
	const validEntry = {
		date: '2026-03-15',
		content: 'Today was productive.',
		location: 'Home',
		weatherTemp: 72,
		weatherCondition: 'Sunny'
	};

	it('accepts a valid journal entry', () => {
		expect(() => journalEntrySchema.parse(validEntry)).not.toThrow();
	});

	it('accepts an entry without optional fields', () => {
		expect(() =>
			journalEntrySchema.parse({ date: '2026-03-15', content: 'Minimal entry.' })
		).not.toThrow();
	});

	it('rejects an invalid date format', () => {
		const result = journalEntrySchema.safeParse({ ...validEntry, date: '15-03-2026' });
		expect(result.success).toBe(false);
	});

	it('rejects an entry with no content', () => {
		const result = journalEntrySchema.safeParse({ ...validEntry, content: '' });
		expect(result.success).toBe(false);
	});

	it('coerces weatherTemp to a number', () => {
		const result = journalEntrySchema.parse({ ...validEntry, weatherTemp: '68' });
		expect(result.weatherTemp).toBe(68);
	});
});

describe('journalFilterSchema', () => {
	it('accepts an empty filter object and applies defaults', () => {
		const result = journalFilterSchema.parse({});
		expect(result.limit).toBe(50);
	});

	it('accepts content and date filters', () => {
		const result = journalFilterSchema.parse({ content: 'walk', date: '2026-03-01' });
		expect(result.content).toBe('walk');
		expect(result.date).toBe('2026-03-01');
	});

	it('rejects a limit below 1', () => {
		expect(journalFilterSchema.safeParse({ limit: 0 }).success).toBe(false);
	});

	it('rejects a limit above 100', () => {
		expect(journalFilterSchema.safeParse({ limit: 101 }).success).toBe(false);
	});

	it('rejects an invalid date format in the filter', () => {
		expect(journalFilterSchema.safeParse({ date: 'not-a-date' }).success).toBe(false);
	});
});

describe('buildWeatherJson', () => {
	it('serializes temp and condition when both are present', () => {
		expect(buildWeatherJson(72, 'Sunny')).toBe('{"temp":72,"condition":"Sunny"}');
	});

	it('serializes when only temp is present', () => {
		expect(buildWeatherJson(72, undefined)).toBe('{"temp":72}');
	});

	it('serializes when only condition is present', () => {
		expect(buildWeatherJson(undefined, 'Cloudy')).toBe('{"condition":"Cloudy"}');
	});

	it('returns null when neither temp nor condition are present', () => {
		expect(buildWeatherJson(undefined, undefined)).toBeNull();
	});
});
