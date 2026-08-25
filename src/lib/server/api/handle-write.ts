import { logger } from '$lib/server/logger';

import { recordApiWrite } from './audit-log';
import { ApiWriteError } from './errors';
import { apiError, apiSuccess } from './response';

type WriteContext = {
	apiKeyId: string;
	userId: string;
	method: string;
	path: string;
	action: string;
};

/**
 * Shared success/failure envelope for every `/api/v1/*` write route: runs `perform`,
 * records an audit-log entry for the outcome either way (per docs/API.md's audit-trail
 * guarantee), and maps a thrown `ApiWriteError` to its typed response or anything else
 * to a logged 500.
 */
export async function handleApiWrite<T>(
	context: WriteContext,
	perform: () => Promise<T>,
	options: { successStatus?: number; failureMessage: string }
): Promise<Response> {
	const successStatus = options.successStatus ?? 201;

	try {
		const result = await perform();
		await recordApiWrite({ ...context, statusCode: successStatus });
		return apiSuccess(result, successStatus);
	} catch (error) {
		const statusCode = error instanceof ApiWriteError ? error.status : 500;
		await recordApiWrite({ ...context, statusCode });

		if (error instanceof ApiWriteError) {
			return apiError(error.code, error.message, error.status);
		}

		logger.error(`API: ${options.failureMessage}`, error);
		return apiError('internal_error', `${options.failureMessage}.`, 500);
	}
}
