import { describe, expect, it } from 'vitest';

import { createUserSchema, sendWelcomeEmailSchema } from './admin-user';

describe('createUserSchema', () => {
	it('accepts a valid user and defaults the role to user', () => {
		const result = createUserSchema.safeParse({ name: 'Ada', email: 'ada@example.com' });
		expect(result.success).toBe(true);
		expect(result.data?.role).toBe('user');
	});

	it('trims the name and normalises the email', () => {
		const result = createUserSchema.safeParse({
			name: '  Ada  ',
			email: '  Ada@Example.COM ',
			role: 'admin'
		});
		expect(result.data).toEqual({ name: 'Ada', email: 'ada@example.com', role: 'admin' });
	});

	it('requires a name', () => {
		expect(createUserSchema.safeParse({ name: '   ', email: 'ada@example.com' }).success).toBe(
			false
		);
	});

	it('rejects an invalid email', () => {
		expect(createUserSchema.safeParse({ name: 'Ada', email: 'not-an-email' }).success).toBe(false);
	});

	it('rejects an unknown role', () => {
		expect(
			createUserSchema.safeParse({ name: 'Ada', email: 'ada@example.com', role: 'owner' }).success
		).toBe(false);
	});
});

describe('sendWelcomeEmailSchema', () => {
	it('requires a user id', () => {
		expect(sendWelcomeEmailSchema.safeParse({ userId: '' }).success).toBe(false);
		expect(sendWelcomeEmailSchema.safeParse({ userId: 'abc' }).success).toBe(true);
	});
});
