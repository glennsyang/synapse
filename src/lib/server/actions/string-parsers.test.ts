import { describe, expect, it } from 'vitest';

import { splitCommaSeparated, toCommaSeparatedJson } from './string-parsers';

describe('splitCommaSeparated', () => {
	it('splits a comma-separated string into trimmed items', () => {
		expect(splitCommaSeparated('a, b, c')).toEqual(['a', 'b', 'c']);
		expect(splitCommaSeparated('one,two,three')).toEqual(['one', 'two', 'three']);
	});

	it('trims whitespace around each item', () => {
		expect(splitCommaSeparated('  hello ,   world  ')).toEqual(['hello', 'world']);
	});

	it('filters out empty items produced by trailing commas', () => {
		expect(splitCommaSeparated('a,,b,')).toEqual(['a', 'b']);
	});

	it('returns an empty array for null, undefined, and empty string', () => {
		expect(splitCommaSeparated(null)).toEqual([]);
		expect(splitCommaSeparated(undefined)).toEqual([]);
		expect(splitCommaSeparated('')).toEqual([]);
	});

	it('returns a single-item array when there is no comma', () => {
		expect(splitCommaSeparated('only')).toEqual(['only']);
	});

	it('returns an empty array for a whitespace-only string', () => {
		expect(splitCommaSeparated('   ')).toEqual([]);
	});
});

describe('toCommaSeparatedJson', () => {
	it('serializes items to a JSON array string', () => {
		expect(toCommaSeparatedJson('alpha, beta, gamma')).toBe('["alpha","beta","gamma"]');
	});

	it('returns null when the input is null, undefined, or empty', () => {
		expect(toCommaSeparatedJson(null)).toBeNull();
		expect(toCommaSeparatedJson(undefined)).toBeNull();
		expect(toCommaSeparatedJson('')).toBeNull();
	});

	it('returns null when all parts are whitespace', () => {
		expect(toCommaSeparatedJson('  ,  ,  ')).toBeNull();
	});

	it('returns a single-element JSON array for a single value', () => {
		expect(toCommaSeparatedJson('item')).toBe('["item"]');
	});
});
