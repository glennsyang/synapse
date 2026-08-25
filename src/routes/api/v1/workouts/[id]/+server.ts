import { ApiWriteError } from '$lib/server/api/errors';
import { handleApiWrite } from '$lib/server/api/handle-write';
import { requireApiKey } from '$lib/server/api/require-api-key';
import { apiError, apiSuccess } from '$lib/server/api/response';
import { apiUpdateWorkoutSchema } from '$lib/server/api/schemas/workouts';
import { getWorkoutWithExercises, updateWorkout } from '$lib/server/db/writes/workouts';
import { logger } from '$lib/server/logger';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, params }) => {
	const auth = await requireApiKey(request, 'workouts:read');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	try {
		const workout = await getWorkoutWithExercises(auth.userId, params.id);
		return apiSuccess(workout);
	} catch (error) {
		if (error instanceof ApiWriteError) {
			return apiError(error.code, error.message, error.status);
		}
		logger.error('API: failed to load workout', error);
		return apiError('internal_error', 'Failed to load workout.', 500);
	}
};

export const PATCH: RequestHandler = async ({ request, params, url }) => {
	const auth = await requireApiKey(request, 'workouts:write');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return apiError('invalid_json', 'Request body must be valid JSON.', 400);
	}

	const parsed = apiUpdateWorkoutSchema.safeParse(body);
	if (!parsed.success) {
		return apiError('validation_failed', parsed.error.issues.map((i) => i.message).join('; '), 400);
	}

	return handleApiWrite(
		{
			apiKeyId: auth.apiKeyId,
			userId: auth.userId,
			method: 'PATCH',
			path: url.pathname,
			action: 'workouts:write'
		},
		() => updateWorkout(auth.userId, params.id, parsed.data),
		{ successStatus: 200, failureMessage: 'Failed to update workout' }
	);
};
