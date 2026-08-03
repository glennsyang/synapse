import type { User } from '$lib/types';
import type { RequestEvent } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';

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
export function requireAuth<
	T,
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>
>(
	handler: (event: RequestEvent<Params>, user: User) => Promise<T>
): (event: RequestEvent<Params>) => Promise<T | ReturnType<typeof fail>> {
	return async (event: RequestEvent<Params>) => {
		if (!event.locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}
		return handler(event, event.locals.user);
	};
}

/**
 * Returns the authenticated user from locals, or throws a redirect to /sign-in.
 * Use in load functions inside the (app) route group where the layout already
 * guarantees authentication — this provides a clean type-narrowed User without
 * needing non-null assertions.
 *
 * @example
 * export const load: PageServerLoad = async ({ locals }) => {
 *   const user = getUser(locals);
 *   // user.id is typed as string, no ! required
 * };
 */
export function getUser(locals: App.Locals): User {
	if (!locals.user) {
		redirect(302, '/sign-in');
	}
	return locals.user;
}

/**
 * Authorization wrapper for SvelteKit actions.
 * Ensures the user is authenticated and has the 'admin' role before executing the action handler.
 *
 * @param handler - The action handler function that requires admin access
 * @returns A wrapped action handler that performs auth + role check
 *
 * @example
 * export const actions = {
 *   unarchivePerson: requireAdmin(async (event, user) => {
 *     // user is guaranteed to be an authenticated admin here
 *   })
 * };
 */
export function requireAdmin<
	T,
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>
>(
	handler: (event: RequestEvent<Params>, user: User) => Promise<T>
): (event: RequestEvent<Params>) => Promise<T | ReturnType<typeof fail>> {
	return async (event: RequestEvent<Params>) => {
		if (!event.locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}
		if (event.locals.user.role !== 'admin') {
			return fail(403, { error: 'Forbidden' });
		}
		return handler(event, event.locals.user);
	};
}
