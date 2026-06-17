import { convertVisitThresholdToDays } from '$lib/utils/visit-status';
import { z } from 'zod';

export const registerSchema = z
	.object({
		name: z
			.string()
			.min(2, 'Name must be at least 2 characters')
			.max(100, 'Name must be at most 100 characters'),
		email: z.email('Please enter a valid email address'),
		password: z
			.string()
			.min(12, 'Password must be at least 12 characters')
			.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
			.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
			.regex(/\d/, 'Password must contain at least one number'),
		confirmPassword: z.string()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword']
	});

export const loginSchema = z.object({
	email: z.email('Please enter a valid email address'),
	password: z.string().min(12, 'Password must be at least 12 characters')
});

export const forgotPasswordSchema = z.object({
	email: z.email('Please enter a valid email address')
});

export const resetPasswordSchema = z
	.object({
		password: z
			.string()
			.min(12, 'Password must be at least 12 characters')
			.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
			.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
			.regex(/\d/, 'Password must contain at least one number'),
		confirmPassword: z.string(),
		// Hidden token field to verify the reset request
		token: z.string().optional()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword']
	});

export const updateProfileSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters')
});

const visitSettingsUnitSchema = z.enum(['days', 'months']);

export const updateVisitStatusSettingsSchema = z
	.object({
		thresholdUnit: visitSettingsUnitSchema.default('days'),
		recentToOverdueValue: z.coerce
			.number()
			.refine((value) => Number.isFinite(value), 'Please enter a valid number')
			.positive('Value must be greater than 0'),
		overdueToCriticalValue: z.coerce
			.number()
			.refine((value) => Number.isFinite(value), 'Please enter a valid number')
			.positive('Value must be greater than 0')
	})
	.refine(
		(data) => {
			const recentToOverdueDays = convertVisitThresholdToDays(
				data.recentToOverdueValue,
				data.thresholdUnit
			);
			const overdueToCriticalDays = convertVisitThresholdToDays(
				data.overdueToCriticalValue,
				data.thresholdUnit
			);

			return overdueToCriticalDays > recentToOverdueDays;
		},
		{
			path: ['overdueToCriticalValue'],
			message: 'Overdue to critical threshold must be greater than recent to overdue threshold'
		}
	);

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Current password is required'),
		newPassword: z.string().min(12, 'New password must be at least 12 characters'),
		confirmPassword: z.string().min(1, 'Please confirm your password')
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword']
	});
