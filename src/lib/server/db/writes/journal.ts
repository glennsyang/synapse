import { buildWeatherJson } from '$lib/schemas/journal';
import { ApiWriteError } from '$lib/server/api/errors';
import type { ApiCreateJournalInput, ApiUpdateJournalInput } from '$lib/server/api/schemas/journal';
import { getDb } from '$lib/server/db';
import { journalEntries } from '$lib/server/db/schema';
import {
	generateId,
	withAuditFieldsForCreate,
	withAuditFieldsForUpdate
} from '$lib/server/db/utils';
import { and, eq } from 'drizzle-orm';

/**
 * Recomputes the `weather` JSON column for a partial update. Since temp/condition are
 * merged into a single JSON blob, patching only one of them must preserve the other
 * rather than clobbering it with `undefined`.
 */
function updatedWeatherJson(existing: string | null, input: ApiUpdateJournalInput): string | null {
	if (input.weatherTemp === undefined && input.weatherCondition === undefined) {
		return existing;
	}

	const existingWeather = existing
		? (JSON.parse(existing) as { temp?: number; condition?: string })
		: {};

	const temp =
		input.weatherTemp !== undefined ? (input.weatherTemp ?? undefined) : existingWeather.temp;
	const condition =
		input.weatherCondition !== undefined
			? (input.weatherCondition ?? undefined)
			: existingWeather.condition;

	return buildWeatherJson(temp, condition);
}

/**
 * Insert path for API-key-driven journal logging. Mirrors the `default` action in
 * src/routes/(app)/journal/new/+page.server.ts, kept as its own standalone function
 * rather than sharing code with that UI action.
 */
export async function createJournalEntry(userId: string, input: ApiCreateJournalInput) {
	const db = getDb();
	const entryId = generateId();

	await db.insert(journalEntries).values({
		id: entryId,
		userId,
		date: input.date,
		content: input.content,
		location: input.location ?? null,
		weather: buildWeatherJson(input.weatherTemp, input.weatherCondition),
		...withAuditFieldsForCreate()
	});

	return db.query.journalEntries.findFirst({ where: eq(journalEntries.id, entryId) });
}

/**
 * Update path for API-key-driven journal updates. Mirrors the `update` action in
 * src/routes/(app)/journal/[id]/+page.server.ts, kept as its own standalone function
 * rather than sharing code with that UI action.
 */
export async function updateJournalEntry(
	userId: string,
	entryId: string,
	input: ApiUpdateJournalInput
) {
	const db = getDb();

	const existing = await db.query.journalEntries.findFirst({
		where: and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId))
	});

	if (!existing) {
		throw new ApiWriteError('not_found', 'Journal entry not found.', 404);
	}

	await db
		.update(journalEntries)
		.set({
			date: input.date ?? existing.date,
			content: input.content ?? existing.content,
			location: input.location !== undefined ? input.location : existing.location,
			weather: updatedWeatherJson(existing.weather, input),
			...withAuditFieldsForUpdate()
		})
		.where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)));

	return db.query.journalEntries.findFirst({ where: eq(journalEntries.id, entryId) });
}
