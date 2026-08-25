import { handleApiWrite } from '$lib/server/api/handle-write';
import { requireApiKey } from '$lib/server/api/require-api-key';
import { apiError, apiSuccess } from '$lib/server/api/response';
import { apiCreateTaskSchema, apiTaskListQuerySchema } from '$lib/server/api/schemas/tasks';
import { getDb } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';
import { createTask } from '$lib/server/db/writes/tasks';
import { logger } from '$lib/server/logger';
import { and, desc, eq } from 'drizzle-orm';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url }) => {
	const auth = await requireApiKey(request, 'tasks:read');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	const parsed = apiTaskListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!parsed.success) {
		return apiError('validation_failed', parsed.error.issues.map((i) => i.message).join('; '), 400);
	}

	const { state, priority, limit } = parsed.data;

	try {
		const conditions = [eq(tasks.userId, auth.userId)];
		if (state) conditions.push(eq(tasks.state, state));
		if (priority) conditions.push(eq(tasks.priority, priority));

		const results = await getDb().query.tasks.findMany({
			where: and(...conditions),
			orderBy: [desc(tasks.createdAt)],
			limit
		});

		return apiSuccess(results);
	} catch (error) {
		logger.error('API: failed to list tasks', error);
		return apiError('internal_error', 'Failed to load tasks.', 500);
	}
};

export const POST: RequestHandler = async ({ request, url }) => {
	const auth = await requireApiKey(request, 'tasks:write');
	if (!auth.ok) return apiError(auth.code, auth.message, auth.status);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return apiError('invalid_json', 'Request body must be valid JSON.', 400);
	}

	const parsed = apiCreateTaskSchema.safeParse(body);
	if (!parsed.success) {
		return apiError('validation_failed', parsed.error.issues.map((i) => i.message).join('; '), 400);
	}

	return handleApiWrite(
		{
			apiKeyId: auth.apiKeyId,
			userId: auth.userId,
			method: 'POST',
			path: url.pathname,
			action: 'tasks:write'
		},
		() => createTask(auth.userId, parsed.data),
		{ successStatus: 201, failureMessage: 'Failed to create task' }
	);
};
