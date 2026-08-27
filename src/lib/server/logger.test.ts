import { afterEach, describe, expect, it, vi } from 'vitest';

const mockCaptureException = vi.hoisted(() => vi.fn<(...args: unknown[]) => void>());
const mockCaptureMessage = vi.hoisted(() => vi.fn<(...args: unknown[]) => void>());

vi.mock('@sentry/sveltekit', () => ({
	captureException: mockCaptureException,
	captureMessage: mockCaptureMessage
}));

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

describe('logger PII redaction (issue #357)', () => {
	afterEach(() => {
		process.env.NODE_ENV = ORIGINAL_NODE_ENV;
		vi.resetModules();
		vi.restoreAllMocks();
		mockCaptureException.mockClear();
		mockCaptureMessage.mockClear();
	});

	it('redacts an email address embedded in an Error message in production', async () => {
		process.env.NODE_ENV = 'production';
		vi.resetModules();
		const { logger } = await import('./logger');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		logger.error('Failed operation', new Error('Failed for a@b.com'));

		const loggedLine = consoleErrorSpy.mock.calls[0]?.[0] as string;
		expect(loggedLine).not.toContain('a@b.com');
		expect(loggedLine).toContain('[redacted]');
	});

	it('redacts a JWT-shaped token embedded in an Error message in production', async () => {
		process.env.NODE_ENV = 'production';
		vi.resetModules();
		const { logger } = await import('./logger');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const fakeJwt =
			'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dQw4w9WgXcQrRZ4rV9v9v9v9v9v9v9v9v9v9v9v9v9v';
		logger.error('Token error', new Error(`Bad token: ${fakeJwt}`));

		const loggedLine = consoleErrorSpy.mock.calls[0]?.[0] as string;
		expect(loggedLine).not.toContain(fakeJwt);
	});

	it('redacts PII embedded in the raw error object handed to Sentry in production', async () => {
		process.env.NODE_ENV = 'production';
		vi.resetModules();
		const { logger } = await import('./logger');
		vi.spyOn(console, 'error').mockImplementation(() => {});

		logger.error('Failed operation', new Error('Failed for a@b.com'));

		const [sentryError] = mockCaptureException.mock.calls[0] as [Error];
		expect(sentryError.message).not.toContain('a@b.com');
	});

	it('still strips structured PII fields from meta in production (regression guard)', async () => {
		process.env.NODE_ENV = 'production';
		vi.resetModules();
		const { logger } = await import('./logger');
		const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

		logger.info('User signed in', { userId: 'user-123', email: 'a@b.com', requestId: 'req-1' });

		const loggedLine = consoleInfoSpy.mock.calls[0]?.[0] as string;
		expect(loggedLine).not.toContain('user-123');
		expect(loggedLine).not.toContain('a@b.com');
		expect(loggedLine).toContain('req-1');
	});

	it('does not redact message content in development mode', async () => {
		process.env.NODE_ENV = 'development';
		vi.resetModules();
		const { logger } = await import('./logger');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		logger.error('Failed operation', new Error('Failed for a@b.com'));

		const loggedLine = consoleErrorSpy.mock.calls[0]?.[0] as string;
		expect(loggedLine).toContain('a@b.com');
	});
});
