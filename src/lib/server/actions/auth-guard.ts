import type { RequestEvent } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';

import type { User } from '../db/types';

/**
 * Authorization wrapper for SvelteKit actions.
 * Ensures the user is authenticated before executing the action handler.
 *
 * @param handler - The action handler function that requires authentication
 * @returns A wrapped action handler that performs auth check
 *
 * @example
 * export const actions = {
 *   create: requireAuth(async (event, user) => {
 *     // user is guaranteed to be defined here
 *     const userId = user.id;
 *     // ... rest of logic
 *   })
 * };
 */
export function requireAuth<T>(
	handler: (event: RequestEvent, user: User) => Promise<T>
): (event: RequestEvent) => Promise<T | ReturnType<typeof fail>> {
	return async (event: RequestEvent) => {
		if (!event.locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}
		return handler(event, event.locals.user);
	};
}
