import { handleApiWrite } from '$lib/server/api/handle-write';
import { requireApiKey } from '$lib/server/api/require-api-key';
import { apiError, apiSuccess } from '$lib/server/api/response';
import { apiCreateJournalSchema, apiJournalListQuerySchema } from '$lib/server/api/schemas/journal';
import { getDb } from '$lib/server/db';
import { journalEntries } from '$lib/server/db/schema';
import { createJournalEntry } from '$lib/server/db/writes/journal';
import { logger } from '$lib/server/logger';
import { and, desc, eq, gte, like, lte } from 'drizzle-orm';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url }) => {
	const auth = await requireApiKey(request, 'journal:read');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	const parsed = apiJournalListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!parsed.success) {
		return apiError('validation_failed', parsed.error.issues.map((i) => i.message).join('; '), 400);
	}

	const { startDate, endDate, content, limit } = parsed.data;

	try {
		const conditions = [eq(journalEntries.userId, auth.userId)];
		if (startDate && endDate) {
			conditions.push(gte(journalEntries.date, startDate), lte(journalEntries.date, endDate));
		}
		if (content) conditions.push(like(journalEntries.content, `%${content}%`));

		const results = await getDb().query.journalEntries.findMany({
			where: and(...conditions),
			orderBy: [desc(journalEntries.date)],
			limit
		});

		return apiSuccess(results);
	} catch (error) {
		logger.error('API: failed to list journal entries', error);
		return apiError('internal_error', 'Failed to load journal entries.', 500);
	}
};

export const POST: RequestHandler = async ({ request, url }) => {
	const auth = await requireApiKey(request, 'journal:write');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return apiError('invalid_json', 'Request body must be valid JSON.', 400);
	}

	const parsed = apiCreateJournalSchema.safeParse(body);
	if (!parsed.success) {
		return apiError('validation_failed', parsed.error.issues.map((i) => i.message).join('; '), 400);
	}

	return handleApiWrite(
		{
			apiKeyId: auth.apiKeyId,
			userId: auth.userId,
			method: 'POST',
			path: url.pathname,
			action: 'journal:write'
		},
		() => createJournalEntry(auth.userId, parsed.data),
		{ successStatus: 201, failureMessage: 'Failed to create journal entry' }
	);
};
