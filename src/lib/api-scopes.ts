/**
 * The full set of permissions an external API key can be granted. Kept as a flat
 * `resource:action` string so it's easy to render as UI checkboxes and store on a
 * superforms schema, while still mapping cleanly onto the `{ resource: string[] }`
 * permissions record the better-auth API key plugin expects.
 */
export const API_SCOPES = [
	'tasks:read',
	'tasks:write',
	'mood:read',
	'mood:write',
	'workouts:read',
	'workouts:write',
	'meals:read',
	'meals:write',
	'visits:read',
	'visits:write',
	'people:read'
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

/** Groups flat scope strings into the `{ resource: [action, ...] }` shape better-auth expects. */
export function scopesToPermissions(scopes: readonly ApiScope[]): Record<string, string[]> {
	const permissions: Record<string, string[]> = {};
	for (const scope of scopes) {
		const [resource, action] = scope.split(':');
		(permissions[resource] ??= []).push(action);
	}
	return permissions;
}

/** Builds the single-scope permissions record passed to `auth.api.verifyApiKey`. */
export function permissionsForScope(scope: ApiScope): Record<string, string[]> {
	const [resource, action] = scope.split(':');
	return { [resource]: [action] };
}
