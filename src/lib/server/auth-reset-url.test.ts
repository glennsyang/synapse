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

	describe('malformed URL', () => {
		it('throws for a non-URL string', () => {
			expect(() => buildResetUrl('not-a-url', TOKEN)).toThrow(
				'Invalid callbackURL: not a valid URL'
			);
		});

		it('throws for an empty string', () => {
			expect(() => buildResetUrl('', TOKEN)).toThrow('Invalid callbackURL: not a valid URL');
		});
	});

	describe('untrusted origin', () => {
		it('throws for an attacker-controlled origin', () => {
			expect(() => buildResetUrl('https://evil.example.com/steal', TOKEN)).toThrow(
				'Untrusted callbackURL origin: https://evil.example.com'
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
