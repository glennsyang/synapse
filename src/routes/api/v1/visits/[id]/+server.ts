import { handleApiWrite } from '$lib/server/api/handle-write';
import { requireApiKey } from '$lib/server/api/require-api-key';
import { apiError, apiSuccess } from '$lib/server/api/response';
import { apiUpdateVisitSchema } from '$lib/server/api/schemas/visits';
import { getDb } from '$lib/server/db';
import { visits } from '$lib/server/db/schema';
import { updateVisit } from '$lib/server/db/writes/visits';
import { logger } from '$lib/server/logger';
import { and, eq } from 'drizzle-orm';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, params }) => {
	const auth = await requireApiKey(request, 'visits:read');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	try {
		const visit = await getDb().query.visits.findFirst({
			where: and(eq(visits.id, params.id), eq(visits.userId, auth.userId))
		});

		if (!visit) {
			return apiError('not_found', 'Visit not found.', 404);
		}

		return apiSuccess(visit);
	} catch (error) {
		logger.error('API: failed to load visit', error);
		return apiError('internal_error', 'Failed to load visit.', 500);
	}
};

export const PATCH: RequestHandler = async ({ request, params, url }) => {
	const auth = await requireApiKey(request, 'visits:write');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return apiError('invalid_json', 'Request body must be valid JSON.', 400);
	}

	const parsed = apiUpdateVisitSchema.safeParse(body);
	if (!parsed.success) {
		return apiError('validation_failed', parsed.error.issues.map((i) => i.message).join('; '), 400);
	}

	return handleApiWrite(
		{
			apiKeyId: auth.apiKeyId,
			userId: auth.userId,
			method: 'PATCH',
			path: url.pathname,
			action: 'visits:write'
		},
		() => updateVisit(auth.userId, params.id, parsed.data),
		{ successStatus: 200, failureMessage: 'Failed to update visit' }
	);
};
