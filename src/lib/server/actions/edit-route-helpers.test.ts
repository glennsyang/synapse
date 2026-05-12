import { isHttpError, isRedirect } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';

import { getOwnedEntityOrNull, getOwnedEntityOrThrow } from './edit-route-helpers';

describe('getOwnedEntityOrThrow', () => {
	it('returns the entity when found', async () => {
		const entity = { id: 'entity_1', name: 'Test' };
		const result = await getOwnedEntityOrThrow(async () => entity, {
			type: 'error',
			message: 'Not found'
		});

		expect(result).toBe(entity);
	});

	it('throws a redirect when the entity is not found and behavior is redirect', async () => {
		expect.assertions(2);

		try {
			await getOwnedEntityOrThrow(async () => undefined, {
				type: 'redirect',
				to: '/tasks'
			});
		} catch (e) {
			expect(isRedirect(e)).toBe(true);
			if (isRedirect(e)) {
				expect(e.location).toBe('/tasks');
			}
		}
	});

	it('uses the provided redirect status code', async () => {
		expect.assertions(2);

		try {
			await getOwnedEntityOrThrow(async () => undefined, {
				type: 'redirect',
				to: '/tasks',
				status: 301
			});
		} catch (e) {
			expect(isRedirect(e)).toBe(true);
			if (isRedirect(e)) {
				expect(e.status).toBe(301);
			}
		}
	});

	it('defaults redirect status to 303 when not specified', async () => {
		expect.assertions(1);

		try {
			await getOwnedEntityOrThrow(async () => undefined, {
				type: 'redirect',
				to: '/home'
			});
		} catch (e) {
			if (isRedirect(e)) {
				expect(e.status).toBe(303);
			}
		}
	});

	it('throws an HTTP error when the entity is not found and behavior is error', async () => {
		expect.assertions(2);

		try {
			await getOwnedEntityOrThrow(async () => undefined, {
				type: 'error',
				message: 'Task not found'
			});
		} catch (e) {
			expect(isHttpError(e)).toBe(true);
			if (isHttpError(e)) {
				expect(e.status).toBe(404);
			}
		}
	});

	it('uses the provided error status code', async () => {
		expect.assertions(1);

		try {
			await getOwnedEntityOrThrow(async () => undefined, {
				type: 'error',
				message: 'Forbidden',
				status: 403
			});
		} catch (e) {
			if (isHttpError(e)) {
				expect(e.status).toBe(403);
			}
		}
	});
});

describe('getOwnedEntityOrNull', () => {
	it('returns the entity when found', async () => {
		const entity = { id: 'entity_1' };
		const result = await getOwnedEntityOrNull(async () => entity);
		expect(result).toBe(entity);
	});

	it('returns null when the entity is not found', async () => {
		const result = await getOwnedEntityOrNull(async () => undefined);
		expect(result).toBeNull();
	});
});
