import { handleApiWrite } from '$lib/server/api/handle-write';
import { requireApiKey } from '$lib/server/api/require-api-key';
import { apiError, apiSuccess } from '$lib/server/api/response';
import { apiCreateVisitSchema, apiVisitListQuerySchema } from '$lib/server/api/schemas/visits';
import { getDb } from '$lib/server/db';
import { visits } from '$lib/server/db/schema';
import { createVisit } from '$lib/server/db/writes/visits';
import { logger } from '$lib/server/logger';
import { and, desc, eq } from 'drizzle-orm';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url }) => {
	const auth = await requireApiKey(request, 'visits:read');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	const parsed = apiVisitListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!parsed.success) {
		return apiError('validation_failed', parsed.error.issues.map((i) => i.message).join('; '), 400);
	}

	const { personId, limit } = parsed.data;

	try {
		const conditions = [eq(visits.userId, auth.userId)];
		if (personId) conditions.push(eq(visits.personId, personId));

		const results = await getDb().query.visits.findMany({
			where: and(...conditions),
			orderBy: [desc(visits.date)],
			limit
		});

		return apiSuccess(results);
	} catch (error) {
		logger.error('API: failed to list visits', error);
		return apiError('internal_error', 'Failed to load visits.', 500);
	}
};

export const POST: RequestHandler = async ({ request, url }) => {
	const auth = await requireApiKey(request, 'visits:write');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return apiError('invalid_json', 'Request body must be valid JSON.', 400);
	}

	const parsed = apiCreateVisitSchema.safeParse(body);
	if (!parsed.success) {
		return apiError('validation_failed', parsed.error.issues.map((i) => i.message).join('; '), 400);
	}

	return handleApiWrite(
		{
			apiKeyId: auth.apiKeyId,
			userId: auth.userId,
			method: 'POST',
			path: url.pathname,
			action: 'visits:write'
		},
		() => createVisit(auth.userId, parsed.data),
		{ successStatus: 201, failureMessage: 'Failed to create visit' }
	);
};
