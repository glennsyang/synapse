import { and, desc, eq, gte, like, lte } from 'drizzle-orm';

import { journalFilterSchema } from '$lib/schemas/journal';
import { getDb } from '$lib/server/db';
import { journalEntries } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Auth handled by (app)/+layout.server.ts

	const filters = journalFilterSchema.safeParse({
		tag: url.searchParams.get('tag') ?? undefined,
		startDate: url.searchParams.get('startDate') ?? undefined,
		endDate: url.searchParams.get('endDate') ?? undefined,
		limit: url.searchParams.get('limit') ?? undefined
	});

	if (!filters.success) {
		logger.error('Invalid filter parameters', { error: filters.error });
		return { entries: [] };
	}

	const { tag, startDate, endDate, limit } = filters.data;

	try {
		const db = getDb();
		const conditions = [eq(journalEntries.userId, locals.user!.id)];

		if (startDate) {
			conditions.push(gte(journalEntries.date, startDate));
		}
		if (endDate) {
			conditions.push(lte(journalEntries.date, endDate));
		}
		if (tag) {
			conditions.push(like(journalEntries.tags, `%"${tag}"%`));
		}

		const entries = await db.query.journalEntries.findMany({
			where: and(...conditions),
			orderBy: [desc(journalEntries.date)],
			limit: limit
		});

		const parsedEntries = entries.map((entry: typeof journalEntries.$inferSelect) => ({
			...entry,
			tags: entry.tags ? JSON.parse(entry.tags) : null,
			weather: entry.weather ? JSON.parse(entry.weather) : null
		}));

		return { entries: parsedEntries };
	} catch (error) {
		logger.error('Failed to load journal entries', { error });
		return { entries: [] };
	}
};
