import { beforeEach, describe, expect, it, vi } from 'vitest';

const { handlerMock, loggerMock } = vi.hoisted(() => ({
	handlerMock: vi.fn<(request: Request) => Promise<Response>>(),
	loggerMock: {
		error: vi.fn<(...args: unknown[]) => void>(),
		warn: vi.fn<(...args: unknown[]) => void>(),
		info: vi.fn<(...args: unknown[]) => void>(),
		debug: vi.fn<(...args: unknown[]) => void>()
	}
}));

vi.mock('$lib/server/auth', () => ({
	auth: { handler: handlerMock }
}));

vi.mock('$lib/server/logger', () => ({ logger: loggerMock }));

const { actions } = await import('./+page.server');

const GENERIC = 'If an account exists with that email, you will receive a password reset link.';

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

	it('asks Better Auth to send a reset link via the HTTP handler for a valid email', async () => {
		handlerMock.mockResolvedValueOnce(new Response(JSON.stringify({ status: true })));

		const result = await actions.default({ request: forgotRequest('user@example.com') } as never);

		expect(handlerMock).toHaveBeenCalledOnce();
		const [request] = handlerMock.mock.calls[0];
		expect(request.method).toBe('POST');
		expect(new URL(request.url).pathname).toBe('/api/auth/request-password-reset');
		expect(request.headers.get('content-type')).toBe('application/json');
		expect(await request.json()).toEqual({
			email: 'user@example.com',
			redirectTo: '/reset-password'
		});
		expect(result).toMatchObject({ form: { message: { type: 'success', text: GENERIC } } });
	});

	it('does not call Better Auth for an invalid email', async () => {
		const result = await actions.default({ request: forgotRequest('not-an-email') } as never);

		expect(handlerMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});

	it('returns the same generic message (styled as success, not error) when Better Auth responds non-ok', async () => {
		handlerMock.mockResolvedValueOnce(new Response(null, { status: 429 }));

		const result = await actions.default({ request: forgotRequest('user@example.com') } as never);

		expect(loggerMock.error).toHaveBeenCalledWith(
			'Password reset request failed',
			expect.objectContaining({
				message: 'Password reset request failed with status 429'
			})
		);
		expect(result).toMatchObject({
			status: 400,
			data: { form: { message: { type: 'success', text: GENERIC } } }
		});
	});
});
