import { describe, expect, it } from 'vitest';

import { apiError, apiSuccess } from './response';

describe('apiSuccess', () => {
	it('wraps data in a { data } envelope with a 200 default status', async () => {
		const response = apiSuccess({ id: '1' });
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ data: { id: '1' } });
	});

	it('honors a custom status', async () => {
		const response = apiSuccess({ id: '1' }, 201);
		expect(response.status).toBe(201);
	});

	it('never sets a CORS header', () => {
		const response = apiSuccess({ id: '1' });
		expect(response.headers.get('access-control-allow-origin')).toBeNull();
	});
});

describe('apiError', () => {
	it('wraps a code and message in an { error } envelope', async () => {
		const response = apiError('invalid_api_key', 'Invalid API key.', 401);
		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			error: { code: 'invalid_api_key', message: 'Invalid API key.' }
		});
	});

	it('never sets a CORS header', () => {
		const response = apiError('internal_error', 'Failed.', 500);
		expect(response.headers.get('access-control-allow-origin')).toBeNull();
	});
});
