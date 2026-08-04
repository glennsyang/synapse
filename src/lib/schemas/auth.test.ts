import { describe, expect, it } from 'vitest';

import {
	changePasswordSchema,
	forgotPasswordSchema,
	loginSchema,
	registerSchema,
	resetPasswordSchema,
	updateDashboardGoalSettingsSchema,
	updateProfileSchema
} from './auth';

describe('registerSchema', () => {
	const validPayload = {
		name: 'Alice Smith',
		email: 'alice@example.com',
		password: 'SecurePass1!',
		confirmPassword: 'SecurePass1!'
	};

	it('accepts a valid registration payload', () => {
		expect(() => registerSchema.parse(validPayload)).not.toThrow();
	});

	it('rejects a name shorter than 2 characters', () => {
		const result = registerSchema.safeParse({ ...validPayload, name: 'A' });
		expect(result.success).toBe(false);
	});

	it('rejects a name longer than 100 characters', () => {
		const result = registerSchema.safeParse({ ...validPayload, name: 'A'.repeat(101) });
		expect(result.success).toBe(false);
	});

	it('rejects an invalid email address', () => {
		const result = registerSchema.safeParse({ ...validPayload, email: 'not-an-email' });
		expect(result.success).toBe(false);
	});

	it('rejects a password shorter than 12 characters', () => {
		const result = registerSchema.safeParse({
			...validPayload,
			password: 'Short1',
			confirmPassword: 'Short1'
		});
		expect(result.success).toBe(false);
	});

	it('rejects a password without an uppercase letter', () => {
		const result = registerSchema.safeParse({
			...validPayload,
			password: 'alllowercase1!',
			confirmPassword: 'alllowercase1!'
		});
		expect(result.success).toBe(false);
	});

	it('rejects a password without a lowercase letter', () => {
		const result = registerSchema.safeParse({
			...validPayload,
			password: 'ALLUPPERCASE1!',
			confirmPassword: 'ALLUPPERCASE1!'
		});
		expect(result.success).toBe(false);
	});

	it('rejects a password without a digit', () => {
		const result = registerSchema.safeParse({
			...validPayload,
			password: 'NoDigitsHere!!',
			confirmPassword: 'NoDigitsHere!!'
		});
		expect(result.success).toBe(false);
	});

	it('rejects when passwords do not match', () => {
		const result = registerSchema.safeParse({
			...validPayload,
			confirmPassword: 'DifferentPass1!'
		});
		expect(result.success).toBe(false);
		expect(result).toMatchObject({
			success: false,
			error: {
				issues: expect.arrayContaining([expect.objectContaining({ path: ['confirmPassword'] })])
			}
		});
	});
});

describe('loginSchema', () => {
	it('accepts valid credentials', () => {
		expect(() =>
			loginSchema.parse({ email: 'user@example.com', password: 'ValidPass123' })
		).not.toThrow();
	});

	it('rejects an invalid email', () => {
		const result = loginSchema.safeParse({ email: 'bad', password: 'ValidPass123' });
		expect(result.success).toBe(false);
	});

	it('rejects a password shorter than 12 characters', () => {
		const result = loginSchema.safeParse({ email: 'user@example.com', password: 'short' });
		expect(result.success).toBe(false);
	});
});

describe('forgotPasswordSchema', () => {
	it('accepts a valid email', () => {
		expect(() => forgotPasswordSchema.parse({ email: 'user@example.com' })).not.toThrow();
	});

	it('rejects an invalid email', () => {
		expect(forgotPasswordSchema.safeParse({ email: 'not-valid' }).success).toBe(false);
	});
});

describe('resetPasswordSchema', () => {
	const validReset = {
		password: 'NewSecurePass1!',
		confirmPassword: 'NewSecurePass1!',
		token: 'abc123'
	};

	it('accepts a valid reset payload', () => {
		expect(() => resetPasswordSchema.parse(validReset)).not.toThrow();
	});

	it('rejects when passwords do not match', () => {
		const result = resetPasswordSchema.safeParse({
			...validReset,
			confirmPassword: 'Mismatch123!'
		});
		expect(result.success).toBe(false);
	});

	it('token is optional', () => {
		const { token: _token, ...withoutToken } = validReset;
		expect(() => resetPasswordSchema.parse(withoutToken)).not.toThrow();
	});
});

describe('updateProfileSchema', () => {
	it('accepts a valid name', () => {
		expect(() => updateProfileSchema.parse({ name: 'Alice' })).not.toThrow();
	});

	it('rejects an empty name', () => {
		expect(updateProfileSchema.safeParse({ name: '' }).success).toBe(false);
	});

	it('rejects a name longer than 100 characters', () => {
		expect(updateProfileSchema.safeParse({ name: 'A'.repeat(101) }).success).toBe(false);
	});
});

describe('changePasswordSchema', () => {
	it('accepts valid change password payload', () => {
		expect(() =>
			changePasswordSchema.parse({
				currentPassword: 'OldPass123456',
				newPassword: 'NewSecurePass1!',
				confirmPassword: 'NewSecurePass1!'
			})
		).not.toThrow();
	});

	it('rejects when new passwords do not match', () => {
		const result = changePasswordSchema.safeParse({
			currentPassword: 'OldPass123456',
			newPassword: 'NewPass12345!',
			confirmPassword: 'Different123!'
		});
		expect(result.success).toBe(false);
	});
});

describe('updateDashboardGoalSettingsSchema', () => {
	const validPayload = {
		meditationWeeklyGoal: 2,
		workoutGreenThreshold: 12,
		workoutAmberThreshold: 8
	};

	it('accepts a valid payload', () => {
		expect(() => updateDashboardGoalSettingsSchema.parse(validPayload)).not.toThrow();
	});

	it('rejects a non-positive meditation weekly goal', () => {
		const result = updateDashboardGoalSettingsSchema.safeParse({
			...validPayload,
			meditationWeeklyGoal: 0
		});
		expect(result.success).toBe(false);
	});

	it('rejects a non-positive green threshold', () => {
		const result = updateDashboardGoalSettingsSchema.safeParse({
			...validPayload,
			workoutGreenThreshold: 0
		});
		expect(result.success).toBe(false);
	});

	it('accepts a zero amber threshold', () => {
		const result = updateDashboardGoalSettingsSchema.safeParse({
			...validPayload,
			workoutAmberThreshold: 0
		});
		expect(result.success).toBe(true);
	});

	it('rejects a negative amber threshold', () => {
		const result = updateDashboardGoalSettingsSchema.safeParse({
			...validPayload,
			workoutAmberThreshold: -1
		});
		expect(result.success).toBe(false);
	});

	it('rejects when amber threshold is not less than green threshold', () => {
		const result = updateDashboardGoalSettingsSchema.safeParse({
			...validPayload,
			workoutGreenThreshold: 8,
			workoutAmberThreshold: 8
		});
		expect(result.success).toBe(false);
	});
});
