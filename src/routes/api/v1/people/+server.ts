import { requireApiKey } from '$lib/server/api/require-api-key';
import { apiError, apiSuccess } from '$lib/server/api/response';
import { apiPeopleListQuerySchema } from '$lib/server/api/schemas/people';
import { getDb } from '$lib/server/db';
import { people } from '$lib/server/db/schema';
import { logger } from '$lib/server/logger';
import { and, asc, eq } from 'drizzle-orm';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url }) => {
	const auth = await requireApiKey(request, 'people:read');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	const parsed = apiPeopleListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!parsed.success) {
		return apiError('validation_failed', parsed.error.issues.map((i) => i.message).join('; '), 400);
	}

	try {
		const conditions = [eq(people.userId, auth.userId)];
		if (!parsed.data.includeArchived) {
			conditions.push(eq(people.isArchived, false));
		}

		const results = await getDb().query.people.findMany({
			where: and(...conditions),
			orderBy: [asc(people.name)],
			columns: { id: true, name: true, isArchived: true, scheduledVisitDate: true }
		});

		return apiSuccess(results);
	} catch (error) {
		logger.error('API: failed to list people', error);
		return apiError('internal_error', 'Failed to load people.', 500);
	}
};
