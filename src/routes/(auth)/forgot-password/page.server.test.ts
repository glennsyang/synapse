import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestPasswordResetMock, loggerMock } = vi.hoisted(() => ({
	requestPasswordResetMock: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
	loggerMock: {
		error: vi.fn<(...args: unknown[]) => void>(),
		warn: vi.fn<(...args: unknown[]) => void>(),
		info: vi.fn<(...args: unknown[]) => void>(),
		debug: vi.fn<(...args: unknown[]) => void>()
	}
}));

vi.mock('$lib/server/auth', () => ({
	auth: { api: { requestPasswordReset: requestPasswordResetMock } }
}));

vi.mock('$lib/server/logger', () => ({ logger: loggerMock }));

import { FORGOT_PASSWORD_RESPONSE } from '$lib/server/auth/forgot-password-response';

const { actions } = await import('./+page.server');

const GENERIC = FORGOT_PASSWORD_RESPONSE.text;

function forgotRequest(email: string) {
	return new Request('https://synapse.example.com/forgot-password', {
		method: 'POST',
		body: new URLSearchParams({ email })
	});
}

describe('forgot-password default action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('asks Better Auth to send a reset link via auth.api.requestPasswordReset for a valid email', async () => {
		requestPasswordResetMock.mockResolvedValueOnce({ status: true });

		const request = forgotRequest('user@example.com');
		const result = await actions.default({ request } as never);

		expect(requestPasswordResetMock).toHaveBeenCalledOnce();
		expect(requestPasswordResetMock).toHaveBeenCalledWith({
			body: { email: 'user@example.com', redirectTo: '/reset-password' },
			headers: request.headers
		});
		expect(result).toMatchObject({ form: { message: { type: 'success', text: GENERIC } } });
	});

	it('does not call Better Auth for an invalid email', async () => {
		const result = await actions.default({ request: forgotRequest('not-an-email') } as never);

		expect(requestPasswordResetMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});

	it('returns the same generic message (styled as success, not error) when Better Auth throws', async () => {
		requestPasswordResetMock.mockRejectedValueOnce(new Error('Password reset request failed'));

		const result = await actions.default({ request: forgotRequest('user@example.com') } as never);

		expect(loggerMock.error).toHaveBeenCalledWith(
			'Password reset request failed',
			expect.objectContaining({
				message: 'Password reset request failed'
			})
		);
		expect(result).toMatchObject({
			status: 400,
			data: { form: { message: { type: 'success', text: GENERIC } } }
		});
	});
});
