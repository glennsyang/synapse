import { z } from 'zod';

const taskTagsSchema = z.array(z.string());

/**
 * Parses a task's stored JSON tags string, returning null for missing,
 * malformed, or non-array data instead of throwing.
 */
export function parseTaskTags(rawTags: string | null | undefined): string[] | null {
	if (!rawTags) {
		return null;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(rawTags);
	} catch {
		return null;
	}

	const result = taskTagsSchema.safeParse(parsed);
	return result.success ? result.data : null;
}

export function splitCommaSeparated(value: string | null | undefined): string[] {
	if (!value) {
		return [];
	}

	return value
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
}

export function toCommaSeparatedJson(value: string | null | undefined): string | null {
	const parsed = splitCommaSeparated(value);
	return parsed.length > 0 ? JSON.stringify(parsed) : null;
}
