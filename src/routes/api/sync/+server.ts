import { json } from '@sveltejs/kit';

import { syncData } from '$lib/server/sync';
import { logger } from '$lib/utils/logger';

import type { RequestHandler } from './$types';

/**
 * POST /api/sync
 * Sync client data with server using last-write-wins conflict resolution
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;

	if (!user) {
		logger.warn('Unauthorized sync attempt');
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const syncRequest = await request.json();

		// Validate request structure
		if (!syncRequest || typeof syncRequest !== 'object') {
			logger.warn('Invalid sync request structure', { userId: user.id });
			return json({ error: 'Invalid request' }, { status: 400 });
		}

		// Perform sync
		const syncResponse = await syncData(syncRequest, user);

		logger.info('Sync request processed', {
			userId: user.id,
			success: syncResponse.success,
			changes: syncRequest.changes?.length || 0,
			conflicts: syncResponse.conflicts.length,
			errors: syncResponse.errors.length
		});

		return json(syncResponse, {
			status: syncResponse.success ? 200 : 207 // 207 Multi-Status for partial success
		});
	} catch (error) {
		logger.error('Sync endpoint error', {
			error: error instanceof Error ? error.message : String(error),
			userId: user.id,
			stack: error instanceof Error ? error.stack : undefined
		});

		return json(
			{
				success: false,
				syncedAt: new Date().toISOString(),
				conflicts: [],
				serverChanges: [],
				errors: [error instanceof Error ? error.message : 'Unknown error occurred']
			},
			{ status: 500 }
		);
	}
};
