import { isRedirect, redirect } from '@sveltejs/kit';
import type { Redirect } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';

import { mapAuthActionError, redirectIfAuthenticated } from './form-helpers';

const mockUser = { id: 'user_123', name: 'Alice', email: 'alice@example.com' };

describe('redirectIfAuthenticated', () => {
	it('throws a redirect to /dashboard when the user is authenticated', () => {
		expect.assertions(2);
		let caughtError: unknown;

		try {
			redirectIfAuthenticated(mockUser as App.Locals['user']);
		} catch (e) {
			caughtError = e;
		}

		expect(isRedirect(caughtError)).toBe(true);
		expect((caughtError as Redirect).location).toBe('/dashboard');
	});

	it('does not throw when the user is null', () => {
		expect(() => redirectIfAuthenticated(undefined)).not.toThrow();
	});

	it('does not throw when the user is undefined', () => {
		expect(() => redirectIfAuthenticated(undefined)).not.toThrow();
	});
});

describe('mapAuthActionError', () => {
	it('re-throws a redirect error unchanged', () => {
		// Create a redirect via the SvelteKit helper, which throws
		let redirectError: unknown;
		let caughtError: unknown;
		try {
			redirect(302, '/sign-in');
		} catch (e) {
			redirectError = e;
		}

		expect.assertions(1);
		try {
			mapAuthActionError(redirectError, 'fallback message');
		} catch (e) {
			caughtError = e;
		}

		expect(isRedirect(caughtError)).toBe(true);
	});

	it('returns the fallback message for non-redirect errors', () => {
		const result = mapAuthActionError(new Error('some error'), 'Sign-in failed');
		expect(typeof result).toBe('string');
		expect(result.length).toBeGreaterThan(0);
	});

	it('returns the fallback message for unknown errors', () => {
		const result = mapAuthActionError('unexpected', 'Default error message');
		expect(typeof result).toBe('string');
	});
});
