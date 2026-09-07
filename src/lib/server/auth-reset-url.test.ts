import { describe, expect, it, vi } from 'vitest';

const mockLoggerWarn = vi.hoisted(() => vi.fn<() => void>());

vi.mock('$app/env/private', () => ({
	BETTER_AUTH_BASE_URL: 'https://synapse.fly.dev',
	NODE_ENV: 'production'
}));

vi.mock('./logger', () => ({
	logger: {
		warn: mockLoggerWarn,
		info: vi.fn<() => void>(),
		debug: vi.fn<() => void>(),
		error: vi.fn<() => void>()
	}
}));

import { buildResetUrl } from './auth-reset-url';

const ALLOWED_ORIGIN = 'https://synapse.fly.dev';
const TOKEN = 'abc123resettoken';

describe('buildResetUrl', () => {
	describe('valid allowed origin', () => {
		it('returns a URL string for an allowed origin', () => {
			const result = buildResetUrl(`${ALLOWED_ORIGIN}/auth/reset-password`, TOKEN);
			expect(result).toBeTypeOf('string');
		});

		it('appends the token via searchParams (no double question mark)', () => {
			const result = buildResetUrl(`${ALLOWED_ORIGIN}/auth/reset-password`, TOKEN);
			const url = new URL(result);
			expect(url.searchParams.get('token')).toBe(TOKEN);
			expect(result.split('?').length).toBe(2);
		});

		it('overwrites an existing token param rather than duplicating it', () => {
			const callbackURL = `${ALLOWED_ORIGIN}/auth/reset-password?token=oldtoken`;
			const result = buildResetUrl(callbackURL, TOKEN);
			const url = new URL(result);
			expect(url.searchParams.get('token')).toBe(TOKEN);
			expect(url.searchParams.getAll('token')).toHaveLength(1);
		});

		it('preserves existing non-token query params', () => {
			const callbackURL = `${ALLOWED_ORIGIN}/auth/reset-password?redirect=%2Fdashboard`;
			const result = buildResetUrl(callbackURL, TOKEN);
			const url = new URL(result);
			expect(url.searchParams.get('redirect')).toBe('/dashboard');
			expect(url.searchParams.get('token')).toBe(TOKEN);
		});

		it('does not call logger.warn for a trusted origin', () => {
			buildResetUrl(`${ALLOWED_ORIGIN}/auth/reset-password`, TOKEN);
			expect(mockLoggerWarn).not.toHaveBeenCalled();
		});
	});

	describe('root-relative callbackURL', () => {
		it('resolves a relative path against the base URL and appends the token', () => {
			const result = buildResetUrl('/reset-password', TOKEN);
			const url = new URL(result);
			expect(url.origin).toBe(ALLOWED_ORIGIN);
			expect(url.pathname).toBe('/reset-password');
			expect(url.searchParams.get('token')).toBe(TOKEN);
		});

		it('does not call logger.warn for a relative path', () => {
			buildResetUrl('/reset-password', TOKEN);
			expect(mockLoggerWarn).not.toHaveBeenCalled();
		});
	});

	describe('non-URL / empty callbackURL', () => {
		// With base resolution these no longer throw; they land on a path of the
		// trusted origin, which is safe — the origin allowlist is the real guard.
		it('resolves a bare string to a path on the allowed origin', () => {
			const result = buildResetUrl('not-a-url', TOKEN);
			const url = new URL(result);
			expect(url.origin).toBe(ALLOWED_ORIGIN);
			expect(url.searchParams.get('token')).toBe(TOKEN);
		});

		it('resolves an empty string to the base origin', () => {
			const result = buildResetUrl('', TOKEN);
			const url = new URL(result);
			expect(url.origin).toBe(ALLOWED_ORIGIN);
			expect(url.searchParams.get('token')).toBe(TOKEN);
		});
	});

	describe('untrusted origin', () => {
		it('throws for an attacker-controlled origin', () => {
			expect(() => buildResetUrl('https://evil.example.com/steal', TOKEN)).toThrow(
				'Untrusted callbackURL origin: https://evil.example.com'
			);
		});

		it('throws for a protocol-relative URL pointing at a foreign host', () => {
			expect(() => buildResetUrl('//evil.example.com/steal', TOKEN)).toThrow(
				'Untrusted callbackURL origin: https://evil.example.com'
			);
			expect(mockLoggerWarn).toHaveBeenCalledWith(
				'Password reset blocked: untrusted callbackURL origin',
				{ origin: 'https://evil.example.com' }
			);
		});

		it('throws for an origin that only partially matches the allowlist', () => {
			expect(() => buildResetUrl('https://synapse.fly.dev.evil.com/reset', TOKEN)).toThrow(
				'Untrusted callbackURL origin'
			);
		});

		it('throws for http variant of the production origin', () => {
			expect(() => buildResetUrl('http://synapse.fly.dev/auth/reset-password', TOKEN)).toThrow(
				'Untrusted callbackURL origin: http://synapse.fly.dev'
			);
		});

		it('calls logger.warn with the blocked origin', () => {
			try {
				buildResetUrl('https://evil.example.com/steal', TOKEN);
			} catch {
				// expected
			}
			expect(mockLoggerWarn).toHaveBeenCalledWith(
				'Password reset blocked: untrusted callbackURL origin',
				{ origin: 'https://evil.example.com' }
			);
		});
	});
});
