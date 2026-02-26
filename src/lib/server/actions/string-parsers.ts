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
