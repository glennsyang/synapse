import { handleApiWrite } from '$lib/server/api/handle-write';
import { requireApiKey } from '$lib/server/api/require-api-key';
import { apiError, apiSuccess } from '$lib/server/api/response';
import { apiCreateMealSchema, apiMealListQuerySchema } from '$lib/server/api/schemas/meals';
import { getDb } from '$lib/server/db';
import { mealLogs } from '$lib/server/db/schema';
import { createMeal } from '$lib/server/db/writes/meals';
import { logger } from '$lib/server/logger';
import { and, desc, eq, gte, lte } from 'drizzle-orm';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url }) => {
	const auth = await requireApiKey(request, 'meals:read');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	const parsed = apiMealListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!parsed.success) {
		return apiError('validation_failed', parsed.error.issues.map((i) => i.message).join('; '), 400);
	}

	const { startDate, endDate, timeOfDay, limit } = parsed.data;

	try {
		const conditions = [eq(mealLogs.userId, auth.userId)];
		if (startDate && endDate) {
			conditions.push(gte(mealLogs.date, startDate), lte(mealLogs.date, endDate));
		}
		if (timeOfDay) conditions.push(eq(mealLogs.timeOfDay, timeOfDay));

		const results = await getDb().query.mealLogs.findMany({
			where: and(...conditions),
			orderBy: [desc(mealLogs.date)],
			limit
		});

		return apiSuccess(results);
	} catch (error) {
		logger.error('API: failed to list meals', error);
		return apiError('internal_error', 'Failed to load meals.', 500);
	}
};

export const POST: RequestHandler = async ({ request, url }) => {
	const auth = await requireApiKey(request, 'meals:write');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return apiError('invalid_json', 'Request body must be valid JSON.', 400);
	}

	const parsed = apiCreateMealSchema.safeParse(body);
	if (!parsed.success) {
		return apiError('validation_failed', parsed.error.issues.map((i) => i.message).join('; '), 400);
	}

	return handleApiWrite(
		{
			apiKeyId: auth.apiKeyId,
			userId: auth.userId,
			method: 'POST',
			path: url.pathname,
			action: 'meals:write'
		},
		() => createMeal(auth.userId, parsed.data),
		{ successStatus: 201, failureMessage: 'Failed to create meal' }
	);
};
