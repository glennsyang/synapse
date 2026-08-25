import { describe, expect, it } from 'vitest';

import { permissionsForScope, scopesToPermissions } from './api-scopes';

describe('scopesToPermissions', () => {
	it('groups flat scopes into a resource -> actions record', () => {
		expect(scopesToPermissions(['tasks:read', 'tasks:write', 'mood:read'])).toEqual({
			tasks: ['read', 'write'],
			mood: ['read']
		});
	});

	it('returns an empty record for no scopes', () => {
		expect(scopesToPermissions([])).toEqual({});
	});
});

describe('permissionsForScope', () => {
	it('builds a single-scope permissions record', () => {
		expect(permissionsForScope('visits:write')).toEqual({ visits: ['write'] });
	});
});
