import { ApiWriteError } from '$lib/server/api/errors';
import type { ApiCreateVisitInput, ApiUpdateVisitInput } from '$lib/server/api/schemas/visits';
import { getDb } from '$lib/server/db';
import { people, visits } from '$lib/server/db/schema';
import {
	generateId,
	withAuditFieldsForCreate,
	withAuditFieldsForUpdate
} from '$lib/server/db/utils';
import { and, eq } from 'drizzle-orm';

function companionsToJson(companions: string[] | undefined | null): string | null {
	if (!companions || companions.length === 0) return null;
	return JSON.stringify(companions);
}

/**
 * Insert path for API-key-driven visit logging. Mirrors the `logVisit` action in
 * src/routes/(app)/visits/[id]/+page.server.ts — verifying the person belongs to the
 * caller and clearing a stale `scheduledVisitDate` — kept as its own standalone
 * function rather than sharing code with that UI action.
 */
export async function createVisit(userId: string, input: ApiCreateVisitInput) {
	const db = getDb();

	const person = await db.query.people.findFirst({
		where: and(eq(people.id, input.personId), eq(people.userId, userId))
	});

	if (!person) {
		throw new ApiWriteError('not_found', 'Person not found.', 404);
	}

	const visitId = generateId();

	await db.insert(visits).values({
		id: visitId,
		personId: input.personId,
		userId,
		date: input.date,
		time: input.time ?? null,
		companions: companionsToJson(input.companions),
		notes: input.notes ?? null,
		followUpDate: input.followUpDate ?? null,
		...withAuditFieldsForCreate()
	});

	if (person.scheduledVisitDate) {
		await db
			.update(people)
			.set({ scheduledVisitDate: null, ...withAuditFieldsForUpdate() })
			.where(and(eq(people.id, input.personId), eq(people.userId, userId)));
	}

	return db.query.visits.findFirst({ where: eq(visits.id, visitId) });
}

/**
 * Update path for API-key-driven visit updates. Mirrors the `updateVisit` action in
 * src/routes/(app)/visits/[id]/+page.server.ts, kept as its own standalone function
 * rather than sharing code with that UI action.
 */
export async function updateVisit(userId: string, visitId: string, input: ApiUpdateVisitInput) {
	const db = getDb();

	const existing = await db.query.visits.findFirst({
		where: and(eq(visits.id, visitId), eq(visits.userId, userId))
	});

	if (!existing) {
		throw new ApiWriteError('not_found', 'Visit not found.', 404);
	}

	await db
		.update(visits)
		.set({
			date: input.date ?? existing.date,
			time: input.time !== undefined ? input.time : existing.time,
			companions:
				input.companions !== undefined ? companionsToJson(input.companions) : existing.companions,
			notes: input.notes !== undefined ? input.notes : existing.notes,
			followUpDate: input.followUpDate !== undefined ? input.followUpDate : existing.followUpDate,
			...withAuditFieldsForUpdate()
		})
		.where(and(eq(visits.id, visitId), eq(visits.userId, userId)));

	return db.query.visits.findFirst({ where: eq(visits.id, visitId) });
}
