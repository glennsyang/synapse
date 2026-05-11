import { and, desc, eq, like } from 'drizzle-orm';

import { journalFilterSchema } from '$lib/schemas/journal';
import { getUser } from '$lib/server/actions/auth-guard';
import { getDb } from '$lib/server/db';
import { journalEntries } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const filters = journalFilterSchema.safeParse({
		content: url.searchParams.get('content') ?? undefined,
		date: url.searchParams.get('date') ?? undefined,
		limit: url.searchParams.get('limit') ?? undefined
	});

	if (!filters.success) {
		logger.error('Invalid filter parameters', { error: filters.error });
		return {
			entries: [],
			filters: { content: '', date: '' }
		};
	}

	const { content, date, limit } = filters.data;

	try {
		const db = getDb();
		const conditions = [eq(journalEntries.userId, getUser(locals).id)];

		if (date) {
			conditions.push(eq(journalEntries.date, date));
		}
		if (content?.trim()) {
			conditions.push(like(journalEntries.content, `%${content.trim()}%`));
		}

		const entries = await db.query.journalEntries.findMany({
			where: and(...conditions),
			orderBy: [desc(journalEntries.date)],
			limit
		});

		const parsedEntries = entries.map((entry: typeof journalEntries.$inferSelect) => ({
			...entry,
			weather: entry.weather ? JSON.parse(entry.weather) : null
		}));

		return {
			entries: parsedEntries,
			filters: {
				content: content ?? '',
				date: date ?? ''
			}
		};
	} catch (error) {
		logger.error('Failed to load journal entries', { error });
		return {
			entries: [],
			filters: {
				content: content ?? '',
				date: date ?? ''
			}
		};
	}
};
