import { handleApiWrite } from '$lib/server/api/handle-write';
import { requireApiKey } from '$lib/server/api/require-api-key';
import { apiError, apiSuccess } from '$lib/server/api/response';
import { apiUpdateJournalSchema } from '$lib/server/api/schemas/journal';
import { getDb } from '$lib/server/db';
import { journalEntries } from '$lib/server/db/schema';
import { updateJournalEntry } from '$lib/server/db/writes/journal';
import { logger } from '$lib/server/logger';
import { and, eq } from 'drizzle-orm';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, params }) => {
	const auth = await requireApiKey(request, 'journal:read');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	try {
		const entry = await getDb().query.journalEntries.findFirst({
			where: and(eq(journalEntries.id, params.id), eq(journalEntries.userId, auth.userId))
		});

		if (!entry) {
			return apiError('not_found', 'Journal entry not found.', 404);
		}

		return apiSuccess(entry);
	} catch (error) {
		logger.error('API: failed to load journal entry', error);
		return apiError('internal_error', 'Failed to load journal entry.', 500);
	}
};

export const PATCH: RequestHandler = async ({ request, params, url }) => {
	const auth = await requireApiKey(request, 'journal:write');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return apiError('invalid_json', 'Request body must be valid JSON.', 400);
	}

	const parsed = apiUpdateJournalSchema.safeParse(body);
	if (!parsed.success) {
		return apiError('validation_failed', parsed.error.issues.map((i) => i.message).join('; '), 400);
	}

	return handleApiWrite(
		{
			apiKeyId: auth.apiKeyId,
			userId: auth.userId,
			method: 'PATCH',
			path: url.pathname,
			action: 'journal:write'
		},
		() => updateJournalEntry(auth.userId, params.id, parsed.data),
		{ successStatus: 200, failureMessage: 'Failed to update journal entry' }
	);
};
