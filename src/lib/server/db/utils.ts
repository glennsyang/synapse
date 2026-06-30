import { randomUUID } from 'node:crypto';

// Helper function to generate a UUID for new records
export const generateId = () => randomUUID();

export function withAuditFieldsForCreate() {
	const now = new Date().toISOString();
	return { createdAt: now, updatedAt: now };
}

export function withAuditFieldsForUpdate() {
	return { updatedAt: new Date().toISOString() };
}
