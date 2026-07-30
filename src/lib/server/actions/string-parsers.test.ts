import { describe, expect, it } from 'vitest';

import { parseTaskTags, splitCommaSeparated, toCommaSeparatedJson } from './string-parsers';

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

describe('parseTaskTags', () => {
	it('parses a JSON array string into an array of tags', () => {
		expect(parseTaskTags('["alpha","beta"]')).toEqual(['alpha', 'beta']);
	});

	it('returns null for null, undefined, and empty string', () => {
		expect(parseTaskTags(null)).toBeNull();
		expect(parseTaskTags(undefined)).toBeNull();
		expect(parseTaskTags('')).toBeNull();
	});

	it('returns null for malformed JSON', () => {
		expect(parseTaskTags('not json')).toBeNull();
	});

	it('returns null when the parsed JSON is not an array of strings', () => {
		expect(parseTaskTags('{"a":1}')).toBeNull();
		expect(parseTaskTags('[1,2,3]')).toBeNull();
		expect(parseTaskTags('"just a string"')).toBeNull();
	});

	it('returns an empty array when stored tags are an empty JSON array', () => {
		expect(parseTaskTags('[]')).toEqual([]);
	});
});
