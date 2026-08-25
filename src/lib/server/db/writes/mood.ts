import type { ApiUpsertMoodInput } from '$lib/server/api/schemas/mood';
import { getDb } from '$lib/server/db';
import { moodLogs } from '$lib/server/db/schema';
import {
	generateId,
	withAuditFieldsForCreate,
	withAuditFieldsForUpdate
} from '$lib/server/db/utils';
import { and, eq } from 'drizzle-orm';

function normalizeOptionalText(value: string | undefined): string | null {
	if (!value) return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

/**
 * Create-or-update path for API-key-driven mood logging. Mirrors the `upsertMood`
 * action in src/routes/(app)/tasks/+page.server.ts — one mood log per user per day,
 * kept as its own standalone function rather than sharing code with that UI action.
 */
export async function upsertMood(userId: string, input: ApiUpsertMoodInput) {
	const db = getDb();

	const existing = await db.query.moodLogs.findFirst({
		where: and(eq(moodLogs.userId, userId), eq(moodLogs.date, input.date))
	});

	const customMood = input.mood === 'custom' ? normalizeOptionalText(input.customMood) : null;
	const notes = normalizeOptionalText(input.notes);

	if (existing) {
		await db
			.update(moodLogs)
			.set({
				mood: input.mood,
				customMood,
				notes,
				...withAuditFieldsForUpdate()
			})
			.where(and(eq(moodLogs.id, existing.id), eq(moodLogs.userId, userId)));

		return db.query.moodLogs.findFirst({ where: eq(moodLogs.id, existing.id) });
	}

	const moodLogId = generateId();
	await db.insert(moodLogs).values({
		id: moodLogId,
		userId,
		date: input.date,
		mood: input.mood,
		customMood,
		notes,
		...withAuditFieldsForCreate()
	});

	return db.query.moodLogs.findFirst({ where: eq(moodLogs.id, moodLogId) });
}
