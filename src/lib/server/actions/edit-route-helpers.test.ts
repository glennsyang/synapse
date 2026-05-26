import { isHttpError, isRedirect } from '@sveltejs/kit';
import type { HttpError, Redirect } from '@sveltejs/kit';
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
		let caughtError: unknown;

		try {
			await getOwnedEntityOrThrow(async () => undefined, {
				type: 'redirect',
				to: '/tasks'
			});
		} catch (e) {
			caughtError = e;
		}

		expect(isRedirect(caughtError)).toBe(true);
		expect((caughtError as Redirect).location).toBe('/tasks');
	});

	it('uses the provided redirect status code', async () => {
		expect.assertions(2);
		let caughtError: unknown;

		try {
			await getOwnedEntityOrThrow(async () => undefined, {
				type: 'redirect',
				to: '/tasks',
				status: 301
			});
		} catch (e) {
			caughtError = e;
		}

		expect(isRedirect(caughtError)).toBe(true);
		expect((caughtError as Redirect).status).toBe(301);
	});

	it('defaults redirect status to 303 when not specified', async () => {
		expect.assertions(1);
		let caughtError: unknown;

		try {
			await getOwnedEntityOrThrow(async () => undefined, {
				type: 'redirect',
				to: '/home'
			});
		} catch (e) {
			caughtError = e;
		}

		expect((caughtError as Redirect).status).toBe(303);
	});

	it('throws an HTTP error when the entity is not found and behavior is error', async () => {
		expect.assertions(2);
		let caughtError: unknown;

		try {
			await getOwnedEntityOrThrow(async () => undefined, {
				type: 'error',
				message: 'Task not found'
			});
		} catch (e) {
			caughtError = e;
		}

		expect(isHttpError(caughtError)).toBe(true);
		expect((caughtError as HttpError).status).toBe(404);
	});

	it('uses the provided error status code', async () => {
		expect.assertions(1);
		let caughtError: unknown;

		try {
			await getOwnedEntityOrThrow(async () => undefined, {
				type: 'error',
				message: 'Forbidden',
				status: 403
			});
		} catch (e) {
			caughtError = e;
		}

		expect((caughtError as HttpError).status).toBe(403);
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
