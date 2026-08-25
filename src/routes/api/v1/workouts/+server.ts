import { handleApiWrite } from '$lib/server/api/handle-write';
import { requireApiKey } from '$lib/server/api/require-api-key';
import { apiError, apiSuccess } from '$lib/server/api/response';
import {
	apiCreateWorkoutSchema,
	apiWorkoutListQuerySchema
} from '$lib/server/api/schemas/workouts';
import { getDb } from '$lib/server/db';
import { workoutLogs } from '$lib/server/db/schema';
import { createWorkout } from '$lib/server/db/writes/workouts';
import { logger } from '$lib/server/logger';
import { and, desc, eq, gte, lte } from 'drizzle-orm';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url }) => {
	const auth = await requireApiKey(request, 'workouts:read');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	const parsed = apiWorkoutListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!parsed.success) {
		return apiError('validation_failed', parsed.error.issues.map((i) => i.message).join('; '), 400);
	}

	const { startDate, endDate, type, limit } = parsed.data;

	try {
		const conditions = [eq(workoutLogs.userId, auth.userId)];
		if (startDate && endDate) {
			conditions.push(gte(workoutLogs.date, startDate), lte(workoutLogs.date, endDate));
		}
		if (type) conditions.push(eq(workoutLogs.type, type));

		const results = await getDb().query.workoutLogs.findMany({
			where: and(...conditions),
			orderBy: [desc(workoutLogs.date)],
			limit
		});

		return apiSuccess(results);
	} catch (error) {
		logger.error('API: failed to list workouts', error);
		return apiError('internal_error', 'Failed to load workouts.', 500);
	}
};

export const POST: RequestHandler = async ({ request, url }) => {
	const auth = await requireApiKey(request, 'workouts:write');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return apiError('invalid_json', 'Request body must be valid JSON.', 400);
	}

	const parsed = apiCreateWorkoutSchema.safeParse(body);
	if (!parsed.success) {
		return apiError('validation_failed', parsed.error.issues.map((i) => i.message).join('; '), 400);
	}

	return handleApiWrite(
		{
			apiKeyId: auth.apiKeyId,
			userId: auth.userId,
			method: 'POST',
			path: url.pathname,
			action: 'workouts:write'
		},
		() => createWorkout(auth.userId, parsed.data),
		{ successStatus: 201, failureMessage: 'Failed to create workout' }
	);
};
