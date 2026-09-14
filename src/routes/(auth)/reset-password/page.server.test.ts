import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockIsResetTokenValid = vi.hoisted(() => vi.fn<() => Promise<boolean>>());

vi.mock('$lib/server/auth-reset-url', () => ({
	isResetTokenValid: mockIsResetTokenValid
}));

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
	beforeEach(() => {
		mockIsResetTokenValid.mockReset();
	});

	it('marks the token invalid when the token param is missing', async () => {
		const result = await load(loadEvent('https://synapse.example.com/reset-password'));

		expect(mockIsResetTokenValid).not.toHaveBeenCalled();
		expect(result).toMatchObject({ token: null, invalid: true });
	});

	it('marks the token invalid when the verification row is expired or missing', async () => {
		mockIsResetTokenValid.mockResolvedValue(false);

		const result = await load(loadEvent('https://synapse.example.com/reset-password?token=bad'));

		expect(mockIsResetTokenValid).toHaveBeenCalledWith('bad');
		expect(result).toMatchObject({ token: 'bad', invalid: true });
	});

	it('marks the token valid when a live verification row exists', async () => {
		mockIsResetTokenValid.mockResolvedValue(true);

		const result = await load(loadEvent('https://synapse.example.com/reset-password?token=good'));

		expect(result).toMatchObject({ token: 'good', invalid: false });
	});
});
