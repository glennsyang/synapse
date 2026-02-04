import { randomUUID } from 'node:crypto';

import type { User } from './types';

// Helper function to generate a UUID for new records
export const generateId = () => randomUUID();

/**
 * Add audit fields (createdBy, updatedBy) to new records
 * @param data Original data object
 * @param user Current user object
 */
export function withAuditFieldsForCreate<T extends Record<string, unknown>>(
	data: T,
	user: User
): T & { createdBy: string; updatedBy: string } {
	const userId = user.id.toString();
	return {
		...data,
		createdBy: userId,
		updatedBy: userId
	};
}

/**
 * Add audit fields (updatedBy, updatedAt) to updated records
 * @param data Original data object
 * @param user Current user object
 */
export function withAuditFieldsForUpdate<T extends Record<string, unknown>>(
	data: T,
	user: User
): T & { updatedBy: string; updatedAt: Date } {
	// Import getCurrentUTCTimestamp inline to avoid circular dependency
	const getCurrentUTCTimestamp = () => new Date();
	const userId = user.id.toString();

	return {
		...data,
		updatedBy: userId,
		updatedAt: getCurrentUTCTimestamp()
	};
}
