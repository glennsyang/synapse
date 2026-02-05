import { fail } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

import { getDb } from '$lib/server/db';
import { journalEntries } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { Actions } from './$types';

export const actions: Actions = {
	delete: async ({ params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		try {
			await getDb()
				.delete(journalEntries)
				.where(and(eq(journalEntries.id, params.id), eq(journalEntries.userId, locals.user.id)));

			logger.info('Journal entry deleted', { entryId: params.id, userId: locals.user.id });
		} catch (error) {
			logger.error('Failed to delete journal entry', { error });
			return fail(500, { error: 'Failed to delete journal entry' });
		}

		return { success: true, delete: true };
	}
};
