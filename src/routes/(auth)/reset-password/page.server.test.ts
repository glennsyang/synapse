import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/auth', () => ({
	auth: { api: { resetPassword: vi.fn<() => void>() } }
}));

import { load } from './+page.server';

function loadEvent(url: string) {
	return {
		locals: { user: null },
		url: new URL(url),
		request: new Request(url),
		route: { id: '/(auth)/reset-password' }
	} as never;
}

describe('reset-password load', () => {
	it('marks the token invalid when the token param is missing', async () => {
		const result = await load(loadEvent('https://synapse.example.com/reset-password'));

		expect(result).toMatchObject({ token: null, invalid: true });
	});

	it("marks the token invalid when Better Auth's verifier redirects back with ?error=", async () => {
		const result = await load(
			loadEvent('https://synapse.example.com/reset-password?token=bad&error=INVALID_TOKEN')
		);

		expect(result).toMatchObject({ token: 'bad', invalid: true });
	});

	it('marks the token valid when a token is present with no ?error=', async () => {
		const result = await load(loadEvent('https://synapse.example.com/reset-password?token=good'));

		expect(result).toMatchObject({ token: 'good', invalid: false });
	});
});
