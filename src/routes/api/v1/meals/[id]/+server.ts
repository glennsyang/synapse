import { handleApiWrite } from '$lib/server/api/handle-write';
import { requireApiKey } from '$lib/server/api/require-api-key';
import { apiError, apiSuccess } from '$lib/server/api/response';
import { apiUpdateMealSchema } from '$lib/server/api/schemas/meals';
import { getDb } from '$lib/server/db';
import { mealLogs } from '$lib/server/db/schema';
import { updateMeal } from '$lib/server/db/writes/meals';
import { logger } from '$lib/server/logger';
import { and, eq } from 'drizzle-orm';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, params }) => {
	const auth = await requireApiKey(request, 'meals:read');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	try {
		const meal = await getDb().query.mealLogs.findFirst({
			where: and(eq(mealLogs.id, params.id), eq(mealLogs.userId, auth.userId))
		});

		if (!meal) {
			return apiError('not_found', 'Meal not found.', 404);
		}

		return apiSuccess(meal);
	} catch (error) {
		logger.error('API: failed to load meal', error);
		return apiError('internal_error', 'Failed to load meal.', 500);
	}
};

export const PATCH: RequestHandler = async ({ request, params, url }) => {
	const auth = await requireApiKey(request, 'meals:write');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return apiError('invalid_json', 'Request body must be valid JSON.', 400);
	}

	const parsed = apiUpdateMealSchema.safeParse(body);
	if (!parsed.success) {
		return apiError('validation_failed', parsed.error.issues.map((i) => i.message).join('; '), 400);
	}

	return handleApiWrite(
		{
			apiKeyId: auth.apiKeyId,
			userId: auth.userId,
			method: 'PATCH',
			path: url.pathname,
			action: 'meals:write'
		},
		() => updateMeal(auth.userId, params.id, parsed.data),
		{ successStatus: 200, failureMessage: 'Failed to update meal' }
	);
};
